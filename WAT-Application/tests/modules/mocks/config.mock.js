WAT.module('$config',[],function(){
    var configuration = {
        prefix: 'wat_',
        defaultDownloadName: 'wat_project.txt',
        log: 'verbose',  // verbose < info < warning < error < none
        log_showOnly: ['ElementPattern','$patterns','$refreshDaemon'],
        log_excluded: [],
        appElementClass: 'wat-element-generic',
        patternTagClass: 'wat-tags',
        pluginPath : '/',
        excludeClassRegex:/(^wat-|^wat_)/, // A regex for excluding elements from being part of a pattern, (this allows to exclude our application elements).
    };
    return configuration;
});