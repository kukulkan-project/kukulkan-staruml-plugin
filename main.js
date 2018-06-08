define(function (require, exports, module) {
    "use strict";

    var Commands = app.getModule("command/Commands"),
        CommandManager = app.getModule("command/CommandManager"),
        MenuManager = app.getModule("menu/MenuManager"),
        ProjectManager = app.getModule("engine/ProjectManager"),
        ExtensionUtils = app.getModule("utils/ExtensionUtils"),
        NodeDomain = app.getModule("utils/NodeDomain"),
        FileSystem = app.getModule("filesystem/FileSystem"),
        Toast = app.getModule('ui/Toast');

    var kukulkanDomain = new NodeDomain("kukulkan", ExtensionUtils.getModulePath(module, "node/KukulkanDomain"));

    function toKukulkanFile() {
        var projectFile = ProjectManager.getFilename();
        var parentFolder = projectFile.substring(0, projectFile.lastIndexOf('/'));
        FileSystem.showSaveDialog("Save Kukulkan file as...", parentFolder, "Model.3k", function (err, filename) {
            if (!err) {
                if (filename) {
                    kukulkanDomain.exec("toKukulkanFile", projectFile, filename)
                        .done(function (p) {
                            console.log("Result " + p);
                            if (p === true) {
                                Toast.info("Kukulkan file saved on " + filename);
                            } else {
                                Toast.error(p);
                            }

                        }
                        )
                        .fail(function (err) {
                            Toast.error("Error while generating kukulkan file");
                        }
                        );
                }
            }
        });

    }

    //Register command
    var CMD_TOKUKULKANFILE = "tools.tokukulkanfile";
    CommandManager.register("Export as Kukulkan File", CMD_TOKUKULKANFILE, toKukulkanFile);

    //Add item to menu
    var menu = MenuManager.getMenu(Commands.TOOLS);
    menu.addMenuItem(CMD_TOKUKULKANFILE);

});