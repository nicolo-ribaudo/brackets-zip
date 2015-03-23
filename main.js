define(function (require, exports, module) {
    "use strict";

    var _               = brackets.getModule("thirdparty/lodash"),
        CommandManager  = brackets.getModule("command/CommandManager"),
        Dialogs         = brackets.getModule("widgets/Dialogs"),
        FileSystem      = brackets.getModule("filesystem/FileSystem"),
        MainViewFactory = brackets.getModule("view/MainViewFactory"),
        Menus           = brackets.getModule("command/Menus"),
        ProjectManager  = brackets.getModule("project/ProjectManager");

    var Strings         = require("strings"),
        ZipManager      = require("ZipManager"),
        askForPathTpl   = require("text!html/ask-for-path-dialog.html");

    var CMD_ZIP   = "brackets-zip.zip",
        CMD_UNZIP = "brackets-zip.unzip";

    var fileContextMenu = Menus.getContextMenu(Menus.ContextMenuIds.PROJECT_MENU),
        zipRegExp = /\.zip$/i;

    var unzipCommand;

    function _isZip(fsEntry) {
        return fsEntry._isFile && zipRegExp.test(fsEntry.fullPath);
    }

    function _getSelectedItem() {
        return ProjectManager.getSelectedItem();
    }

    function _confirm(message) {
        var deferred = $.Deferred();
        Dialogs.showModalDialog("", "", message, [{
            className: Dialogs.DIALOG_BTN_CLASS_PRIMARY,
            text: Strings.OK,
            id: Dialogs.DIALOG_BTN_OK
        }, {
            className: Dialogs.DIALOG_BTN_CLASS_NORMAL,
            text: Strings.CANCEL,
            id: Dialogs.DIALOG_BTN_CANCEL
        }]).getPromise().then(function (buttonId) {
            if (buttonId === Dialogs.DIALOG_BTN_OK) {
                deferred.resolve();
            } else {
                deferred.reject();
            }
        });
        return deferred.promise();
    }

    function _askForPath(defaultPath, defaultFile) {
        var deferred = $.Deferred(),
            dialog = Dialogs.showModalDialog("", defaultFile ? Strings.ZIP_TITLE : Strings.UNZIP_TITLE, Mustache.render(askForPathTpl, {
                defaultPath: defaultPath,
                defaultFile: defaultFile,
                strings: Strings
            }), [{
                className: Dialogs.DIALOG_BTN_CLASS_PRIMARY,
                text: Strings.OK,
                id: Dialogs.DIALOG_BTN_OK
            }, {
                className: Dialogs.DIALOG_BTN_CLASS_NORMAL,
                text: Strings.CANCEL,
                id: Dialogs.DIALOG_BTN_CANCEL
            }], false),
            $dialog = dialog.getElement(),
            $inputPath = $("#brackets-zip_path", $dialog),
            $inputFile = $("#brackets-zip_file", $dialog),
            $buttons = $(".modal-footer button", $dialog);

        $("#brackets-zip_choose", $dialog).click(function () {
            FileSystem.showOpenDialog(
                false,
                true,
                Strings.CHOOSE_FOLDER,
                $inputPath.val(),
                [],
                function (error, folders) {
                    if (error) {
                        deferred.reject("FileSystem error: " + error);
                    } else if (folders.length) {
                        $inputPath.val(folders[0]);
                    }
                }
            );
        });

        $buttons.filter("[data-button-id='cancel']").click(function () {
            deferred.resolve(true);
        });

        $buttons.filter("[data-button-id='ok']").click(function () {
            var path = $inputPath.val();

            if (defaultFile) {
                path += "/" + $inputFile.val();
                var file = FileSystem.getFileForPath(path);
                file.exists(function (error, exists) {
                    if (error) {
                        deferred.reject("FileSystem error: " + error);
                    } else if (exists) {
                        _confirm(Strings.FILE_EXISTING).then(function () {
                            deferred.resolve(false, path);
                        });
                    } else {
                        deferred.resolve(false, path);
                    }
                });
            } else {
                var dir = FileSystem.getDirectoryForPath(path);
                dir.exists(function (error, exists) {
                    if (error) {
                        deferred.reject("FileSystem error: " + error);
                    } else if (exists) {
                        dir.getContents(function (error, content) {
                            if (error) {
                                deferred.reject("FileSystem error: " + error);
                            } else if (content.length === 0) {
                                deferred.resolve(false, path);
                            } else {
                                _confirm(Strings.NOT_EMPTY).then(function () {
                                    deferred.resolve(false, path);
                                });
                            }
                        });
                    } else {
                        deferred.resolve(false, path);
                    }
                });
            }
        });

        return deferred.promise().always(function () {
            dialog.close();
        });
    }

    function zip() {
        var entry = _getSelectedItem(),
            deferred = $.Deferred(),
            path = PathUtils.parseUrl(entry.fullPath),
            defaultPath,
            defaultFile;

        if (entry._isFile) {
            defaultPath = path.directory;
            defaultFile = path.filename.replace(/(.+?)(\.[^\.]+)?$/, "$1.zip");
        } else {
            var match = path.directory.match(/^(.*)\/([^\/]+)\/$/);
            defaultPath = match[1];
            defaultFile = match[2] + ".zip";
        }

        _askForPath(defaultPath, defaultFile).then(function (closed, path) {
            if (closed) {
                deferred.resolve();
            } else {
                ZipManager.zip(entry.fullPath, path).then(deferred.resolve, deferred.reject);
            }
        }, deferred.reject);
    }

    function unzip() {
        var file = _getSelectedItem(),
            deferred = $.Deferred(),
            defaultPath = file.fullPath.replace(zipRegExp, "/");

        _askForPath(defaultPath).then(function (closed, path) {
            if (closed) {
                deferred.resolve();
            } else {
                ZipManager.unzip(file.fullPath, path).then(deferred.resolve, deferred.reject);
            }
        }, deferred.reject);

        return deferred.promise();
    }

    CommandManager.register(Strings.CMD_ZIP, CMD_ZIP, zip);
    unzipCommand = CommandManager.register(Strings.CMD_UNZIP, CMD_UNZIP, unzip);

    fileContextMenu.addMenuDivider();
    fileContextMenu.addMenuItem(CMD_ZIP);
    fileContextMenu.addMenuItem(CMD_UNZIP);

    fileContextMenu.on("beforeContextMenuOpen", function () {
        unzipCommand.setEnabled(_isZip(_getSelectedItem()));
    });
});