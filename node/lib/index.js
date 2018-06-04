var mdjson = require('metadata-json');
var toModel = require('./converter');

exports.toKukulkanFile = function (path, outputFile, template) {

    var template = template || __dirname + "/kukulkan.ejs";
    var outputFile = outputFile || __dirname + "/model.3k";

    //Load mdj
    mdjson.loadFromFile(path);

    //Load Repository
    var repo = mdjson.Repository;

    //Select UMLClass(es)
    var classes = repo.select("@UMLClass");

    //Filter UMLClass(es) with stereotype "Business Entity"
    var businessEntities = classes.filter(function (c) {
        if (c.stereotype) {
            return c.stereotype.name === "Business Entity";
        }
        return false;
    })

    //Transform UMLClass(es) to intermediate model
    var model = toModel(businessEntities);

    //Render as Kukulkan Grammar
    mdjson.render(template, outputFile, model);
}