
var CaseListPage = require("../pageObjects/CaseListPage");
const CucumberReportLogger = require('../../support/reportLogger');


var { defineSupportCode } = require('cucumber');

defineSupportCode(function ({ And, But, Given, Then, When }) {

    Given('I update object values in reference {string}', async function (objectReference,datatable){
        const objectAtReference = global.scenarioData[objectReference];
        if (!objectAtReference){
            throw new Error(`Object with reference "${objectReference}" not found, check tests steps if reference with with set`);
        }
       
        const rowhash = datatable.rowsHash();

        for (const rowKey of Object.keys(rowhash)){
            objectAtReference[rowKey] = rowhash[rowKey];
        }
    });

});