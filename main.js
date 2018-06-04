define(function (require, exports, module) {
    "use strict";

    var Commands = app.getModule("command/Commands"),
        CommandManager = app.getModule("command/CommandManager"),
        MenuManager = app.getModule("menu/MenuManager"),
        ProjectManager = app.getModule("engine/ProjectManager"),
        Repository = app.getModule("core/Repository"),
        ExtensionUtils = app.getModule("utils/ExtensionUtils"),
        NodeDomain = app.getModule("utils/NodeDomain");

    var kukulkanDomain = new NodeDomain("kukulkan", ExtensionUtils.getModulePath(module, "node/KukulkanDomain"));

    function handleHelloWorld() {
        var filename = ProjectManager.getFilename();
        var parentFolder = filename.substring(0, filename.lastIndexOf('/'));
        kukulkanDomain.exec("toKukulkanFile", filename, parentFolder + "/model.3k")
            .done(function () {
                console.log("Listo!!!");
            }
            )
            .fail(function (err) {
                console.log(err)
            }
            );
    }

    // Add a HelloWorld command
    var CMD_HELLOWORLD = "tools.helloworld";
    CommandManager.register("Hello World", CMD_HELLOWORLD, handleHelloWorld);

    // Add HellWorld menu item (Tools > Hello World)
    var menu = MenuManager.getMenu(Commands.TOOLS);
    menu.addMenuItem(CMD_HELLOWORLD);

});