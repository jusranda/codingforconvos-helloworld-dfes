/**
 * Copyright 2022 Justin Randall, Cisco Systems Inc. All Rights Reserved.
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU
 * General Public License as published by the Free Software Foundation, either version 3 of the License, or 
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without 
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
 * See the GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License along with this program. If not, 
 * see <https://www.gnu.org/licenses/>.
 */
'use strict';

const {DialogFlowEsClient,Intent,Sequence,fmtLog} = require('codingforconvos');

///////////////////////////////////////////
// Create Dialogflow ES Endpoint Client. //
///////////////////////////////////////////

const convoClient = new DialogFlowEsClient({
    // Initialize global session parameters.
    baseParams: {
        botName: '',
        companyName: '',
    },
    // Populate global session parameters from the environment and/or incoming webhook payload.
    populateFromEsPayload: (context, dialogContext) => {
        const payload = dialogContext.payload; // Access the Dialogflow ES webhook payload object.
    
        // Configure Bot Name.
        context.parameters.botName = process.env.BOT_NAME || 'Kaitlin';
        
        // Configure Bot Company Name.
        context.parameters.companyName = payload.companyName || process.env.COMPANY_NAME || 'Cisco';
        
        return context;
    }
});



/////////////////////////////////////////////
// Register Sequences and Intent Handlers. //
/////////////////////////////////////////////

convoClient.registerSequence(new Sequence({
    name: 'welcome', // Sequence name, also used for Dialogflow context name.
    activity: 'understanding how I can help', // Activity description in gerund form, used in course correction.
    identityRequired: false,
    authRequired: false,
    params: {
        isFirstGreeting: '1',
        requireSayIntroBrief: '1',
        requireSayIntroLong: '1',
        requireAskWellbeing: '1'
    },
    navigate: (dialogContext) => { // Navigate the sequence.
        if (dialogContext.currentContext.isFirstGreeting === '1') {
            dialogContext.currentContext.requireSayIntroBrief = '0';
            dialogContext.currentContext.requireSayIntroLong = '1';
        } else {
            dialogContext.currentContext.requireSayIntroBrief = '1';
            dialogContext.currentContext.requireSayIntroLong = '0';
        }

        if (dialogContext.currentContext.requireSayIntroBrief === '1') {
            dialogContext.respondWithEvent('SayIntroBrief');
            return;
        }

        if (dialogContext.currentContext.requireSayIntroLong === '1') {
            dialogContext.respondWithEvent('SayIntroLong');
            return;
        }

        if (dialogContext.currentContext.requireAskWellbeing === '1') {
            dialogContext.respondWithEvent('AskWellbeing');
            return;
        }

        dialogContext.setFulfillmentText();
        console.log('action: '+dialogContext.currentAction+', lastFulfillmentText: '+dialogContext.params.lastFulfillmentText);
        dialogContext.respondWithEvent('AskReasonForContact');
        return;
    }
}));

// Register intents
convoClient.registerIntents(new Intent({
    actions: [
        'input.welcome',
        'wellbeing.positive',
        'wellbeing.negative'
    ],
    sequenceName: 'welcome',
    handler: (dialogContext) => {
        dialogContext.setFulfillmentText();
        return;
    }
}));

convoClient.registerIntent(new Intent({
    action:'welcome.ask.wellbeing',
    sequenceName: 'welcome',
    waitForReply: true,
    handler: (dialogContext) => {
        dialogContext.appendFulfillmentText();
        dialogContext.setCurrentParam('requireAskWellbeing', '0');
        return;
    }
}));

convoClient.registerIntent(new Intent({
    action: 'welcome.say.intro.brief',
    sequenceName: 'welcome',
    handler: (dialogContext) => {
        dialogContext.appendFulfillmentText();
        dialogContext.setFulfillmentText('requireSayIntroBrief', '0');
        return;
    }
}));

convoClient.registerIntent(new Intent({
    action: 'welcome.say.intro.long',
    sequenceName: 'welcome',
    handler: (dialogContext) => {
        dialogContext.appendFulfillmentText();
        dialogContext.setFulfillmentText('requireSayIntroLong', '0');
        return;
    }
}));

convoClient.registerIntent(new Intent({
    action: 'skill.reasonforcontact',
    sequenceName: 'welcome',
    waitForReply: true,
    handler: (dialogContext) => {
        dialogContext.appendFulfillmentText();
        return;
    }
}));


//////////////////////////////////////
// Handle the Dialogflow ES Request //
//////////////////////////////////////

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
 
/**
 * Entry point for Dialogflow ES Webhook Fulfillment Handler.
 * 
 * @param {Object} req  The HTTP request.
 * @param {Object} res  The HTTP response.
 */
async function handleFulfillment (req, res) {
    // TODO: Remove these to avoid printing PII or sensitive info into logs.
    console.log(fmtLog('handleFulfillment', 'Dialogflow Request headers: ' + JSON.stringify(req.headers)));
    console.log(fmtLog('handleFulfillment', 'Dialogflow Request body: ' + JSON.stringify(req.body)));

    return await convoClient.handleRequest(req, res);
}

module.exports = {handleFulfillment};
