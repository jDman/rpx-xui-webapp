

const BrowserWaits = require('../../../support/customWaits');

const locators = {
    existingBooking: {
        location:'',
        fromDate:'',
        toDate:''
    }
}

class WorkAccessPage{

    constructor(){
        this.dateFormat = 'YYYY-MM-DD';


        this.pageContainer = $('exui-booking-home');
        this.radioChooseExistingBooking = element(by.xpath(this.getRadiobuttonXPathWithLabel('Choose an existing booking')));
        this.radioCreateNewBooking = element(by.xpath(this.getRadiobuttonXPathWithLabel('Create a new booking')));
        this.radioViewtasksAndCases = element(by.xpath(this.getRadiobuttonXPathWithLabel('View tasks and cases')));

        this.existingBookingsList = $('');
        this.existingBookings = $$('');

        this.continueButton = element(by.xpath(`//exui-booking-home//button[contains(text(),'Continue')]`));

    }

    getRadiobuttonXPathWithLabel(label){
        return `//exui-booking-home//div[contains(@class,'govuk-radios__item')]//label[contains(text(),'${label}')]`
    }

    async waitForPage(){
        await BrowserWaits.waitForElement(this.pageContainer);
    }

    async amOnPage(){
        const isPresent = await this.pageContainer.isPresent();
        if (!isPresent) {
            return isPresent;
        }
        return await this.pageContainer.isDisplayed(); 
    }

    async isConitnueDisplayed(){
        const isPresent =  await this.continueButton.isPresent();
        if (!isPresent){
            return isPresent;
        }
        return await this.continueButton.isDisplayed(); 
    }

    async getExistingBooksingCount(){
        return await this.existingBookings.count();
    }

    async getMatchingBookings(location, fromDate, toDate){
        const allBookings = await this.getExistingBookingsDetails();
        const matchingBookings = allBookings.filter(booking =>
            booking.locations.includees(location) && booking.fromDate.includes(fromDate) && booking.toDate.includes(toDate)
        );
        return matchingBookings; 
    }

    async isBookingDisplayed(location, fromDate, toDate){
        const matchingBookings = await this.getMatchingBookings(location, fromDate, toDate);
        return matchingBookings.length > 0; 
    }

    async getExistingBookingsDetails(){
        const count = await getExistingBooksingCount();
        const bookings = []; 
        for(let i = 0; i < count ; i++){
            const booking = await this.existingBookings.get(i);
            
            bookings.push({
                location: await this.existingBookings.get(i),
                fromDate: await booking.$('').getText(),
                toDate: await booking.$('').getText(),
                continueBtnElement: booking.$('') 
            }); 
        }
        return bookings; 
    }

}

module.exports = new WorkAccessPage();