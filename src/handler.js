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

const {DialogFlowEsClient,Intent,fmtLog} = require('codingforconvos');

///////////////////////////////////////////
// Create Dialogflow ES Endpoint Client. //
///////////////////////////////////////////

const convoClient = new DialogFlowEsClient({
    // Initialize global session parameters.
    baseParams: {
        companyName: '',
    },
    // Populate global session parameters from the environment and/or incoming webhook payload.
    populateFromEsPayload: (context, dialogContext) => {
        const payload = dialogContext.payload; // Access the Dialogflow ES webhook payload object.
    
        const defaultName = process.env.COMPANY_NAME || 'Cisco';
        context.parameters.companyName = payload.companyName || defaultName;
        
        return context;
    }
});



/////////////////////////////////////////////
// Register Sequences and Intent Handlers. //
/////////////////////////////////////////////

// Register intents
convoClient.registerIntent(new Intent({
    action: 'skill.some.example.intent',
    waitForReply: true,
    handler: (dialogContext) => {
        dialogContext.appendFulfillmentText();
        return;
    }
}));

convoClient.registerIntent(new Intent({
    action: 'skill.speaktoloanofficer',
    waitForReply: false,
    handler: (dialogContext) => {
        dialogContext.setFulfillmentText();
        dialogContext.respondWithEvent('OfferSpeakToAgent', dialogContext.params.lastFulfillmentText);
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
