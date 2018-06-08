(function () {
    "use strict";

    var mdjson = require('metadata-json');

    var constants = {
        zeroOrOne: "0..1",
        one: "1",
        zeroOrMany: "0..*",
        oneOrMany: "1..*",
        many: "*",
        OneToOne: "OneToOne",
        OneToMany: "OneToMany",
        ManyToOne: "ManyToOne",
        ManyToMany: "ManyToMany",
    }


    var model;
    var diagnostics = [];
    var entityHolder = {};

    function addDiagnostic(diagnostic) {
        diagnostics.push(diagnostic);
    }

    function toModel(entities) {
        model = entities.map(function (e) {
            return toEntity(e)
        });
        return {
            model: model,
            diagnostics: diagnostics
        };
    };

    function toEntity(umlClass) {
        var entity;

        entity = {
            name: umlClass.name,
            properties: [],
            relationships: []
        };

        entityHolder[entity.name] = entity; //Add to entityHolder

        //Map properties
        entity.properties = umlClass.attributes.map(function (p) { return toAttribute(p) });

        //Relationships
        var umlAssociations = umlClass.getChildren().filter(function (e) { return e instanceof type.UMLAssociation });
        umlAssociations.forEach(function (a) {
            determineNavigability(a);
        });

        return entity;
    };

    function toAttribute(umlAttribute) {
        var attribute = {
            name: umlAttribute.name,
            type: umlAttribute.type,
            required: false
        };

        if (umlAttribute.multiplicity === constants.one) {
            attribute.required = true;
        }
        return attribute;
    };

    function toRelationship(umlAssociation) {
        var relationship = {
            attributeName: null,
            sourceEntity: null,
            targetEntity: null,
            type: null,
            required: false,
            attributeNameInTarget: null
        }

        var end1Multiplicity = umlAssociation.end1.multiplicity;
        var end2Multiplicity = umlAssociation.end2.multiplicity;

        //Determine left side multiplicity
        if (!end1Multiplicity || end1Multiplicity === constants.zeroOrOne || end1Multiplicity === constants.one) {  //Then left side is 'One'
            //Determine right side multiplicity
            if (!end2Multiplicity || end2Multiplicity === constants.zeroOrOne || end2Multiplicity === constants.one) {  //Then right side is 'One'
                relationship.type = constants.OneToOne;
            } else if (end2Multiplicity === constants.zeroOrMany || end2Multiplicity === constants.oneOrMany || end2Multiplicity === constants.many) {    //Then right side is 'Many'
                relationship.type = constants.OneToMany
            } else {
                addDiagnostic("Unknown multiplicity: " + end2Multiplicity + " in UML Association: " + umlAssociation);
            }
        } else if (end1Multiplicity === constants.zeroOrMany || end1Multiplicity === constants.oneOrMany || end1Multiplicity === constants.many) {    //Then right side is 'Many'
            //Determine right side multiplicity
            if (!end2Multiplicity || end2Multiplicity === zeroOrOne || end2Multiplicity === one) {  //Then right side is 'One'
                relationship.type = constants.ManyToOne;
            } else if (end2Multiplicity === constants.zeroOrMany || end2Multiplicity === constants.oneOrMany || end2Multiplicity === constants.many) { //Then right side is 'Many'
                relationship.type = constants.ManyToMany;
            } else {
                addDiagnostic("Unknown multiplicity: " + end2Multiplicity + " in UML Association: " + umlAssociation);
            }
        }

        //Determine required validator
        if (end2Multiplicity === constants.one || end2Multiplicity === constants.oneOrMany) {
            relationship.required = true;
        }

        return relationship;
    };

    function determineNavigability(umlAssociation) {
        var relationship = toRelationship(umlAssociation);

        var end1 = umlAssociation.end1;
        var end2 = umlAssociation.end2;

        relationship.sourceEntity = end1.reference.name;
        relationship.targetEntity = end2.reference.name;

        if (end1.navigable && end2.navigable) { //Left entity is owner & bidirectional
            relationship.attributeName = end2.name;
            relationship.attributeNameInTarget = end1.name;
            if (entityHolder[end1.reference.name]) {    //Get from entity holder
                var ownerEntity = entityHolder[end1.reference.name];
                ownerEntity.relationships.push(relationship);
            }
        } else if (!end1.navigable && end2.navigable) { //Left entity is owner & unidirectional
            relationship.attributeName = end2.name;
            if (entityHolder[end1.reference.name]) {    //Get from entity holder
                var ownerEntity = entityHolder[end1.reference.name];
                ownerEntity.relationships.push(relationship);
            }
        } else if (end1.navigable && !end2.navigable) { //Right side is owner & unidirectional
            relationship.sourceEntity = end2.reference.name;
            relationship.targetEntity = end1.reference.name;
            relationship.attributeName = end1.name;
            if (entityHolder[end2.reference.name]) {    //Get from entity holder
                var ownerEntity = entityHolder[end2.reference.name];
                ownerEntity.relationships.push(relationship);
            }
        } else if (!end1.navigable && !end2.navigable) { //None entity is navigable
            addDiagnostic("There is no navigability in relationship between Entity " + end1.reference.name + " and Entity " + end2.reference.name);
        }
    };

    function toKukulkanFile(path, outputFile) {
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
        });

        var result = toModel(businessEntities);
        if (result.diagnostics.length == 0) {
            mdjson.render(template, outputFile, result.model);
            return true;
        } else {
            return result.diagnostics;
        }
    }

    function init(domainManager) {
        if (!domainManager.hasDomain("kukulkan")) {
            domainManager.registerDomain("kukulkan", { major: 0, minor: 1 });
        }
        domainManager.registerCommand(
            "kukulkan",
            "toKukulkanFile",
            toKukulkanFile,
            false,
            "Converts the current class diagram to Kukulkan file",
            [{
                name: "mdj",
                type: "string",
                description: "The .mdj file to transform to kukulkan file"
            },
            {
                name: "outputFile",
                type: "string",
                description: "The output file"
            }],
            [{
                name: "result",
                type: "boolean",
                description: "The result"
            }]
        );
    }

    exports.init = init;

}());
