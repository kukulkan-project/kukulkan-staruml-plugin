# StarUML plugin: MDJ to Kukulkan
The StarUML plugin for generate a Kukulkan file from classes in mdj file.

## Validations
[x] Attribute type is not null 
[x] Attribute type is one of Kukulkan types
[x] Attribute multiplicity is one of these: blank, **0..1**, **1**
[x] Multiplicity in relationships is one of these: **0..1**, **1**, __0..*__, __1..*__, __*__
[x] None relationship has both ends defined as no navigable
[x] When an end of a UMLAssociation is navigable, then opposite end has a name. (Ensures the name of the attribute in relationship declarations like **OneToOne**, **OneToMany**, **ManyToOne**, **ManyToMany** in Kukulkan file). 
[] Entity name should be in pascal case
[] Attribute name should be in camel case

## Rules

### Relationship type rule

| End1  | End2  | Type       | required |
|-------|-------|------------|----------|
| Blank | Blank | OneToOne   | false    |
| Blank | 0..1  | OneToOne   | false    |
| Blank | 1     | OneToOne   | true     |
| Blank | 0..*  | OneToMany  | false    |
| Blank | 1..*  | OneToMany  | true     |
| Blank | *     | OneToMany  | false    |
| 0..1  | 0..1  | OneToOne   | false    |
| 0..1  | 1     | OneToOne   | true     |
| 0..1  | 0..*  | OneToMany  | false    |
| 0..1  | 1..*  | OneToMany  | true     |
| 0..1  | *     | OneToMany  | true     |
| 1     | 1     | OneToOne   | true     |
| 1     | 0..*  | OneToMany  | false    |
| 1     | 1..*  | OneToMany  | true     |
| 1     | *     | OneToMany  | false    |
| 0..*  | 0..*  | ManyToMany | false    |
| 0..*  | 1..*  | ManyToMany | true     |
| 0..*  | *     | ManyToMany | false    |
| 1..*  | 1..*  | ManyToMany | true     |
| 1.**  | *     | ManyToMany | false    |
| *     | *     | ManyToMany | false    |

## Determining the owner relationship

| End1 Navigable | End2 Navigable | Direction      | Owner        |
|----------------|----------------|----------------|--------------|
| true           | true           | Bidirectional  | Left entity  |
| true           | false          | Unidirectional | Right entity |
| false          | true           | Unidirectional | Left entity  |
| false          | false          | Unsupported    | Left entity  |