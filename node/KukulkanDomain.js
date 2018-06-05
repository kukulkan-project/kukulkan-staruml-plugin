(function () {
    "use strict";

    var mdjson = require('metadata-json');

    var entityHolder = {};

    //UML Multiplicities
    var zeroOrOne = "0..1";
    var one = "1";
    var zeroOrMany = "0..*";
    var oneOrMany = "1..*";
    var many = "*";

    //Relationships types
    var OneToOne = "OneToOne";
    var OneToMany = "OneToMany";
    var ManyToOne = "ManyToOne";
    var ManyToMany = "ManyToMany";

    function toAttribute(umlAttribute) {
        var attribute = {
            name: umlAttribute.name,
            type: umlAttribute.type,
            required: false
        };

        if (umlAttribute.multiplicity === one) {
            attribute.required = true;
        }
        return attribute;
    }

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
        if (!end1Multiplicity || end1Multiplicity === zeroOrOne || end1Multiplicity === one) {  //Then left side is 'One'
            //Determine right side multiplicity
            if (!end2Multiplicity || end2Multiplicity === zeroOrOne || end2Multiplicity === one) {  //Then right side is 'One'
                relationship.type = OneToOne;
            } else if (end2Multiplicity === zeroOrMany || end2Multiplicity === oneOrMany || end2Multiplicity === many) {    //Then right side is 'Many'
                relationship.type = OneToMany
            } else {
                throw new Error("Unknown multiplicity: " + end2Multiplicity + " in UML Association: " + umlAssociation);
            }
        } else if (end1Multiplicity === zeroOrMany || end1Multiplicity === oneOrMany || end1Multiplicity === many) {    //Then right side is 'Many'
            //Determine right side multiplicity
            if (!end2Multiplicity || end2Multiplicity === zeroOrOne || end2Multiplicity === one) {  //Then right side is 'One'
                relationship.type = ManyToOne;
            } else if (end2Multiplicity === zeroOrMany || end2Multiplicity === oneOrMany || end2Multiplicity === many) { //Then right side is 'Many'
                relationship.type = ManyToMany;
            } else {
                throw new Error("Unknown multiplicity: " + end2Multiplicity + " in UML Association: " + umlAssociation);
            }
        }

        //Determine required validator
        if (end2Multiplicity === one || end2Multiplicity === oneOrMany) {
            relationship.required = true;
        }

        return relationship;
    }

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
            throw new Error("There is no navigability in relationship between Entity " + end1.reference.name + " and Entity " + end2.reference.name);
        }
    }

    function toEntity(umlClass) {
        var entity;

        entity = {
            name: umlClass.name,
            properties: [],
            relationships: []
        };

        entityHolder[entity.name] = entity; //Add to entityHolder

        //Map properties
        entity.properties = umlClass.attributes.map(function (p) {
            return toAttribute(p);
        });
        //entity.properties = umlClass.attributes.map(p => toAttribute(p));

        //Relationships
        //var umlAssociations = umlClass.getChildren().filter(e => e instanceof type.UMLAssociation);
        var umlAssociations = umlClass.getChildren().filter(function (e) {
            if (e instanceof type.UMLAssociation) {
                return true
            }
            return false;
        });
        /*umlAssociations.forEach(a => {
            determineNavigability(a);
        });*/
        umlAssociations.forEach(function (a) {
            determineNavigability(a);
        });
        return entity;
    }

    function toModel(entities) {
        //var model = entities.map(e => toEntity(e));
        var model = entities.map(function (e) {
            return toEntity(e);
        });
        return model;
    };

    function toKukulkanFile(path, outputFile) {
        var template = __dirname + "/kukulkan.ejs";
        var outputFile = outputFile;

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

        //Transform UMLClass(es) to intermediate model
        var model = toModel(businessEntities);
        //Render as Kukulkan Grammar
        mdjson.render(template, outputFile, model);
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