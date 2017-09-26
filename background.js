let prefs = null;

function get_prefs() {
    browser.storage.sync.get({'prefs': {filters: []}}).then((p) => { prefs = p.prefs; });
}

get_prefs();

browser.storage.onChanged.addListener(get_prefs);

function match(url_string, path) {
    let url = new URL(url_string);
    return prefs.filters.find(f => url.hostname.match(f.pattern));
}

function rewrite(filter, url_string, path) {
    const directory_separator = '\\'; //FIXME
    let filename = path.substring(path.lastIndexOf(directory_separator)+1);
    console.log(filename);
    let url = new URL(url_string);
    if (filter.folder) {
        return './' + filter.folder + '/' + filename;
    }
    return filename;
}

function rename_download(item){
    let filter = match(item.url, item.filename);
    if (filter) {
        browser.downloads.onCreated.removeListener(rename_download); //don't get stuck in a loop
        
        browser.downloads.download({
                url: item.url, 
                filename: rewrite(filter, item.url, item.filename)
            }).then(() => {
                browser.downloads.onCreated.addListener(rename_download)
                browser.downloads.cancel(item.id);
                browser.downloads.erase({id: item.id});
            });
            
    }
}

browser.downloads.onCreated.addListener(rename_download);