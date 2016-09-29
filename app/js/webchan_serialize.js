
var chanObjs, jsi = {};

(function() {

    var webchan = new QWebChannel(qt.webChannelTransport, function(channel) {

        jsi.file = channel.objects.file

        if(!jsi.file)
            return log("File interface could not be setup.", ERR)
        else {
            log("File api loaded", INFO)
            registerAPI("fileapi")
        }
        chanObjs = channel.objects
        jsi.filedlg = channel.objects.filedlg
    })

})()

var _recentListener
function pickFile(accepted, rejected, props) {

    var api = jsi.filedlg

    if(!api)
        return log("Failed to open filepicker - API not provided.", ERR)

    if(_recentListener)
        jsi.file.fileChosen.disconnect(_recentListener)

    _recentListener = function(fileUrl) {
        accepted(fileUrl)
    }

    jsi.file.fileChosen.connect(_recentListener)

    // api.rejected.connect(rejected)

    api.visible = true
}

function escapeFilePath(path) {
    return path.replace(/file:\/\/\//gi, "")
}
