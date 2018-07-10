# StarUML plugin: MDJ to Kukulkan
The StarUML plugin for generate a Kukulkan file from classes in mdj file.

## Install StarUML plugin
1. Open `Tools>Extension Manager`
2. Click on 'Install From Url...'
3. Enter `https://github.com/robertovillarejo/mdj-to-kukulkan-staruml-plugin`
4. Click on 'Install'

## Using this plugin
1. Open a class diagram made with Infotec UMLProfile
2. Export class diagram as Kukulkan file `Tools>Export as Kukulkan File`
3. Enter a name for Kukulkan file with valid extensions `3k` or `kukulkan`

## Validations
- [x] Attribute type is not null  
- [x] Attribute type is one of Kukulkan types
- [x] Attribute multiplicity is one of these: blank, **0..1**, **1**
- [x] Multiplicity in relationships is one of these: **0..1**, **1**, __0..*__, __1..*__, __*__
- [x] None relationship has both ends defined as no navigable
- [x] When an end of a UMLAssociation is navigable, then opposite end has a name. (Ensures the name of the attribute in relationship declarations like **OneToOne**, **OneToMany**, **ManyToOne**, **ManyToMany** in Kukulkan file). 
- [ ] Entity name should be in pascal case
- [ ] Attribute name should be in camel case

## Rules

### Relationship type rule

| End1               | End2               | Type       |
|--------------------|--------------------|------------|
| Blank or 1 or 0..1 | Blank or 1 or 0..1 | OneToOne   |
| Blank or 1 or 0..1 | 0..* or 1..* or *  | OneToMany  |
| 0..* or 1..* or *  | Blank or 1 or 0..1 | ManyToOne  |
| 0..* or 1..* or *  | 0..* or 1..* or *  | ManyToMany |

## Determining the relationship owner

The navigable flag in both ends of UML association defines **Unidirectional** or **Bidirectional** relationship.  
**End1** is defined by the class where UML association is created from.  
**End2** is defined by the class where UML association is dropped to.

| End1 Navigable | End2 Navigable | Direction      | Owner        |
|----------------|----------------|----------------|--------------|
| true           | true           | Bidirectional  | Left entity  |
| true           | false          | Unidirectional | Right entity |
| false          | true           | Unidirectional | Left entity  |
| false          | false          | Unsupported    | Left entity  |

When a bidirectional relationship is created, navigable flags in association end are irrelevant.  
**Take care while defining directional relationships**