var { defineSupportCode } = require('cucumber');
const reportLogger = require('../../../support/reportLogger');
const BrowserWaits = require('../../../support/customWaits');
const SoftAssert = require('../../../../ngIntegration/util/softAssert');
const caseDetailsTaskTabPage = require('../../pageObjects/workAllocation/caseDetailsTaskTab'); 
const WorkAllocationDateUtil = require('../../pageObjects/workAllocation/common/workAllocationDateUtil');

defineSupportCode(function ({ And, But, Given, Then, When }) {

    When('I click manage link {string} for task at position {int} in case details tasks tab', async function(manageLinkText,taskPos){
        const taskAttributes = await caseDetailsTaskTabPage.getAttributeElementssDisplayedForTaskAtPos(taskPos);
        reportLogger.AddMessage(`Manage links dislayed for this task ${await taskAttributes['Manage'].getText()}`);
        await caseDetailsTaskTabPage.clickLinkFromTaskAttribute(taskAttributes, 'Manage', manageLinkText)
    });

    Then('I validate case details task tab page is displayed', async function(){
        await BrowserWaits.retryWithActionCallback(async () => {
            expect(await caseDetailsTaskTabPage.container.isPresent(),'Task details ta page display ').be.true

        });
    }); 

    Then('I validate task tab alert container displayed', async function(){
        expect(await caseDetailsTaskTabPage.alertBanner.isPresent()).be.true
    });

    Then('I validate task tab alert banner header is {string}', async function (alertheader) {
        expect(await caseDetailsTaskTabPage.alertBannerHeading.getText()).includes(alertheader);
    });

    Then('I validate task tab alert banner message is {string}', async function (alertMessagee) {
        expect(await caseDetailsTaskTabPage.alertBannerMessage.getText()).includes(alertMessagee);
    });

    Then('I validate task tab active tasks container displayed', async function () {
        expect(await caseDetailsTaskTabPage.activeTasksContainer.isPresent()).to.be.true;
    });

    Then('I validate task tab active tasks displayed count {int}', async function (taskCount) {
        expect(await caseDetailsTaskTabPage.tasks.count()).to.equal(taskCount);
    });



    Then('I validate task tab active task with task name {string} is displayed', async function (taskName) {
        expect(await caseDetailsTaskTabPage.getTaskContainerWithName(taskName)).to.not.equal(null);
    });

    Then('I validate task tab active task at position {int} is {string}', async function (position, taskName) {
        expect(await caseDetailsTaskTabPage.getTaskNameForTaskAtPosition(position)).to.include(taskName);
    });

    Then('I validate task tab active task at position {int} with task name {string} has attributes', async function(position,taskNameExpected ,attributesDatatable){
        const softAssert = new SoftAssert();
        const taskName = await caseDetailsTaskTabPage.getTaskNameForTaskAtPosition(position);
        let taskAttributes = null;

        await BrowserWaits.retryWithActionCallback(async () => {
            taskAttributes = await caseDetailsTaskTabPage.getAttributeElementssDisplayedForTaskAtPos(position);
            reportLogger.AddMessage(`*** Actual values displayed ***`);

            const actualDisplayValues = {};
            for (const taskAttrib of Object.keys(taskAttributes)) {
                const attriText = await taskAttributes[taskAttrib].getText();
                actualDisplayValues[taskAttrib] = attriText;
            }
            reportLogger.FormatPrintJson(actualDisplayValues);

        });
        

        softAssert.setScenario("Task name match");
        await softAssert.assert(async () => expect(taskName).to.includes(taskNameExpected));
        
        const expectedAttributeHashes = attributesDatatable.hashes();

        for (const attributeHash of expectedAttributeHashes){

            const attribName = attributeHash.name;
            const attributeIsDisplayed = attributeHash.isDisplayed.toLowerCase();
            const validateContentType = attributeHash.contentType;
            let contentText = attributeHash.text;

            if (attribName.toLowerCase().includes('date') || attribName.toLowerCase().includes('task created')){
                contentText = WorkAllocationDateUtil.getDateFormat_D_Month_YYYY(contentText);
            }
            
            reportLogger.AddMessage(`Validating task attributes ${attribName}, attributeIsDisplayed ${attributeIsDisplayed}, validateContentType ${validateContentType}, content ${contentText}`);
            

            if (attributeIsDisplayed.includes('true') || attributeIsDisplayed.includes('yes') ){
                softAssert.setScenario(`Task attribute displayed and match content`);

                await softAssert.assert(async () => expect(Object.keys(taskAttributes)).to.includes(attribName));
                await softAssert.assert(async () => expect(await taskAttributes[attribName].getText()).to.includes(contentText) );

                if (validateContentType.toLowerCase().includes('link')){
                    const links = taskAttributes[attribName].$$('a');
                    const linksCount = await links.count();

                    let linktext = '';
                    let isLinkWithTextPresent = false;
                    for (let i = 0; i < linksCount;i++){
                        const linkElement = await links.get(i);
                        linktext = await linkElement.getText();
                        isLinkWithTextPresent = linktext.includes(contentText);
                        if (isLinkWithTextPresent){
                            break;
                        }
                    }
                    await softAssert.setScenario("Task attribute content link");
                    await softAssert.assert(async () => expect(isLinkWithTextPresent).to.be.true, `${linktext} to include ${contentText}`);
                }
            }else{
                await softAssert.setScenario("Task attribute not displayed");
                await softAssert.assert(async () => expect(Object.keys(taskAttributes)).to.not.includes(attribName) );

            }
            softAssert.finally();

        }   
    });


});
