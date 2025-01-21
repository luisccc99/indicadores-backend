const fflip = require('fflip')

const flags = {
    name: 'sendEmail',
    criteria: 'Information something something',
    active: true
}

const checkEmailFlag = (flag) => {
    return flag.active;
}

const features = [
    {
        id: "isEmailSendingOn",
        check: checkEmailFlag(flags)
    }
]

fflip.config({
    criteria: [],
    features: features
})

const featureTrigger = (someFunction) => {
    console.log('this is working?')
    console.log(features);
    console.log(fflip.isFeatureEnabledForUser('isEmailSendingOn'));
    if (fflip.isFeatureEnabledForUser('isEmailSendingOn', flags) === true) {
        console.log('Aight this is working')
        someFunction();
    }
}

module.exports = featureTrigger;