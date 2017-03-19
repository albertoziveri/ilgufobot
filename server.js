'use strict'

const express = require('express')
const Slapp = require('slapp')
const ConvoStore = require('slapp-convo-beepboop')
const Context = require('slapp-context-beepboop')

////ALBIADD
const request = require("request")


// use `PORT` env var on Beep Boop - default to 3000 locally
var port = process.env.PORT || 3000

var slapp = Slapp({
  // Beep Boop sets the SLACK_VERIFY_TOKEN env var
  verify_token: process.env.SLACK_VERIFY_TOKEN,
  convo_store: ConvoStore(),
  context: Context()
})


var HELP_TEXT = `
I will respond to the following messages:
\`help\` - to see this message.
\`hi\` - to demonstrate a conversation that tracks state.
\`thanks\` - to demonstrate a simple response.
\`<type-any-other-text>\` - to demonstrate a random emoticon response, some of the time :wink:.
\`attachment\` - to see a Slack attachment message.
`

//*********************************************
// Setup different handlers for messages
//*********************************************

// response to the user typing "help"
slapp.message('help', ['mention', 'direct_message'], (msg) => {
  msg.say(HELP_TEXT)
})

// "Conversation" flow that tracks state - kicks off when user says hi, hello or hey
slapp
  .message('^(hi|hello|hey)$', ['direct_mention', 'direct_message'], (msg, text) => {
    msg
      .say(`${text}, how are you?`)
      // sends next event from user to this route, passing along state
      .route('how-are-you', { greeting: text })
  })
  .route('how-are-you', (msg, state) => {
    var text = (msg.body.event && msg.body.event.text) || ''

    // user may not have typed text as their next action, ask again and re-route
    if (!text) {
      return msg
        .say("Whoops, I'm still waiting to hear how you're doing.")
        .say('How are you?')
        .route('how-are-you', state)
    }

    // add their response to state
    state.status = text

    msg
      .say(`Ok then. What's your favorite color?`)
      .route('color', state)
  })
  .route('color', (msg, state) => {
    var text = (msg.body.event && msg.body.event.text) || ''

    // user may not have typed text as their next action, ask again and re-route
    if (!text) {
      return msg
        .say("I'm eagerly awaiting to hear your favorite color.")
        .route('color', state)
    }

    // add their response to state
    state.color = text

    msg
      .say('Thanks for sharing.')
      .say(`Here's what you've told me so far: \`\`\`${JSON.stringify(state)}\`\`\``)
    // At this point, since we don't route anywhere, the "conversation" is over
  })

// Can use a regex as well
slapp.message(/^(thanks|thank you)/i, ['mention', 'direct_message'], (msg) => {
  // You can provide a list of responses, and a random one will be chosen
  // You can also include slack emoji in your responses
  msg.say([
    "You're welcome :smile:",
    'You bet',
    ':+1: Of course',
    'Anytime :sun_with_face: :full_moon_with_face:'
  ])
})

// demonstrate returning an attachment...
slapp.message('attachment', ['mention', 'direct_message'], (msg) => {
  msg.say({
    text: 'Check out this amazing attachment! :confetti_ball: ',
    attachments: [{
      text: 'Slapp is a robust open source library that sits on top of the Slack APIs',
      title: 'Slapp Library - Open Source',
      image_url: 'https://storage.googleapis.com/beepboophq/_assets/bot-1.22f6fb.png',
      title_link: 'https://beepboophq.com/',
      color: '#7CD197'
    }]
  })
})



//PROCESSO AGGIUNTA FATTURA
	// if a user says "do it" in a DM
	slapp.message('aggiungi fattura', 'direct_message', (msg) => {
	  // respond with an interactive message with buttons Yes and No
	  var invoiceData = {};
	  msg
	  .say({
	    text: '',
	    attachments: [
	      {
	        text: 'Are you sure?',
	        fallback: 'Are you sure?',
	        callback_id: 'doit_confirm_callback',
	        actions: [
	          { name: 'answer', text: 'Yes', type: 'button', value: 'yes' },
	          { name: 'answer', text: 'No', type: 'button', value: 'no' }
	        ]
	      }]
	    })
	  // handle the response with this route passing state
	  // and expiring the conversation after 20 seconds
	  .route('company', invoiceData, 20)
	})
	
	//ragione sociale
	slapp.route('company', (msg,invoiceData) => {
	  let answer = msg.body.actions[0].value
	  if (answer !== 'yes') {
	    // the answer was not affirmative
	    msg.respond(msg.body.response_url, {
	      text: `OK, not doing it. Whew that was close :cold_sweat:`,
	      delete_original: true
	    })
	    // notice we did NOT specify a route because the conversation is over
	    return
	  }
	  
	  //INIZIO A RIEMPIRE dato che ha risposto SI
	  invoiceData["api_uid"] = "12078";
	  invoiceData["api_key"] = "841b369a3268661b0ca1e768337232b6";
	  invoiceData["id_template"] = "2201";
	  invoiceData["mostra_info_pagamento"] = false;
	  invoiceData["prezzi_ivati"] = true;
	  invoiceData["valuta"] = "EUR";
	  invoiceData["lista_articoli"] = [{}];
	  invoiceData["lista_pagamenti"] = [{}];
	  
	  msg.say('Ok allora qual è la ragione sociale?').route('indirizzo', invoiceData,20)    
	})
	
	
	slapp.route('indirizzo', (msg,invoiceData) => {
	  var response = (msg.body.event && msg.body.event.text) || ''
	  
	  invoiceData["nome"] = response;
	  
	  msg.say("Bene che abbiamo venduto qualcosa a "+response+", ma dimmi, che indirizzo email ha?").route('articolo', invoiceData,20) 
	})
	
	slapp.route('articolo', (msg,invoiceData) => {
	  var response = (msg.body.event && msg.body.event.text) || ''
	  
	  invoiceData["indirizzo_via"] = response;
	  
	  msg.say("Gli manderemo la fattura a"+response+", ora puoi dirmi il nome del primo prodotto venduto?").route('dettagli_articolo', invoiceData,20) 
	})
	
	slapp.route('dettagli_articolo', (msg,invoiceData) => {
	  var response = (msg.body.event && msg.body.event.text) || ''
	  invoiceData["lista_articoli"][0]["nome"] = response;
	  msg.say("Dimmi la taglia dell'articolo o altre informazioni nella descrizione!").route('descrizione_articolo', invoiceData,20) 
	})
	
	slapp.route('descrizione_articolo', (msg,invoiceData) => {
	  var response = (msg.body.event && msg.body.event.text) || ''
	  invoiceData["lista_articoli"][0]["descrizione"] = response;
	  msg.say("Quante unità hai venduto di questo prodotto? (Metti 1 se ne hai venduta 1)").route('quantita_prodotto', invoiceData,20) 
	})
	
	slapp.route('quantita_prodotto', (msg,invoiceData) => {
	  var response = (msg.body.event && msg.body.event.text) || ''
	  var units = parseFloat(response);
	  invoiceData["lista_articoli"][0]["quantita"] = units;
	  msg.say("Ora dimmi il prezzo per unità! Inclusivo di IVA").route('prezzo_prodotto', invoiceData,20) 
	})
	
	slapp.route('prezzo_prodotto', (msg,invoiceData) => {
	  var response = (msg.body.event && msg.body.event.text) || ''
	  response = response.replace(/,/g, '.');
	  var price = parseFloat(response);
	  invoiceData["lista_articoli"][0]["prezzo_lordo"] = price;
	  invoiceData["lista_articoli"][0]["cod_iva"] = 0;
	  msg.say("Perfetto! Quindi hai venduto "+invoiceData["lista_articoli"][0]["nome"]+" unità di "+invoiceData["lista_articoli"][0]["quantita"]+" al prezzo di "+invoiceData["lista_articoli"][0]["prezzo_lordo"]+" "+invoiceData["valuta"])
	
	//pagamenti  
	var MyDate = new Date();
	var MyDateString;
	MyDate.setDate(MyDate.getDate());
	MyDateString = ('0' + MyDate.getDate()).slice(-2) + '/' + ('0' + (MyDate.getMonth()+1)).slice(-2) + '/' + MyDate.getFullYear();  
	invoiceData["lista_pagamenti"][0]["data_scadenza"] = MyDateString;
	invoiceData["lista_pagamenti"][0]["importo"] = price;
	invoiceData["lista_pagamenti"][0]["metodo"] = "cassa";
	invoiceData["lista_pagamenti"][0]["data_saldo"] = MyDateString;
	  
	  
	
	    // QPX REST API URL (I censored my api key)
	    var url = "https://api.fattureincloud.it:443/v1/fatture/nuovo"
		var resoconto = {};
		
	    // fire request
	    request({
	    url: url,
	    method: "POST",
	    json: invoiceData
	}, function (error, response, body) {
	        if (!error && response.statusCode === 200) {
	            console.log(body)
				resoconto["docid"] = body.new_id;
	        }
	        else {
				msg.say("Fattura non inserita, procedere manualmente.")
	            console.log("error: " + error)
	            console.log("response.statusCode: " + response.statusCode)
	            console.log("response.statusText: " + response.statusText)
	            return
	        }
	    })
	    
	    resoconto["email"] = invoiceData["indirizzo_via"];
	    msg.say(resoconto["docid"]);
	    msg.say(resoconto["email"]);
	    
		msg
		.say({
		text: '',
		attachments: [
		  {
		    text: 'Fattura creata! Vuoi mandarla via email?',
		    fallback: 'Fattura creata! Vuoi mandarla via email?',
		    callback_id: 'doit_confirm_callback',
		    actions: [
		      { name: 'answer', text: 'Yes', type: 'button', value: 'yes' },
		      { name: 'answer', text: 'No', type: 'button', value: 'no' }
		    ]
		  }]
		})
	    
	  .route('invia_fattura_email', resoconto, 20)
	})
	
	//Invia email
	slapp.route('invia_fattura_email', (msg,resoconto) => {
	  let answer = msg.body.actions[0].value
	  if (answer !== 'yes') {
	    // the answer was not affirmative
	    msg.respond(msg.body.response_url, {
	      text: `OK, not doing it. Whew that was close :cold_sweat:`,
	      delete_original: true
	    })
	    // notice we did NOT specify a route because the conversation is over
	    return
	  }
	  
	  //procedo ad inviare email
	  var dataEmail = {}
	  dataEmail["api_uid"] = "12078";
	  dataEmail["api_key"] = "841b369a3268661b0ca1e768337232b6";
	  dataEmail["id"] = resoconto["doc_id"];
	  dataEmail["mail_mittente"] = "crew@fromowl.com";
	  dataEmail["mail_destinatario"] = resoconto["email"];
	dataEmail["oggetto"] = "Our invoice for you";
		  dataEmail["messaggio"] = "Hello to see our invoice here.<br /> {{allegati}} Best regards,Divisible Odd srls";
	
		  
	    // QPX REST API URL (I censored my api key)
	    var url = "https://api.fattureincloud.it:443/v1/fatture/inviamail"
		
		var myJSON = JSON.stringify(dataEmail);
		msg.say(myJSON);
		
		
	    // fire request
	    request({
	    url: url,
	    method: "POST",
	    json: dataEmail
	}, function (error, response, body) {
	        if (!error && response.statusCode === 200) {
	            console.log(body)
	            msg.say("Email inviata!")
	        }
	        else {
				msg.say("Email non inviata, procedere manualmente.")
	            console.log("error: " + error)
	            console.log("response.statusCode: " + response.statusCode)
	            console.log("response.statusText: " + response.statusText)
	            return
	        }
	    })
	    
	  
	})

/*end creazione fattura*/







// Catch-all for any other responses not handled above
slapp.message('.*', ['direct_mention', 'direct_message'], (msg) => {
  // respond only 40% of the time
  if (Math.random() < 0.4) {
    msg.say([':wave:', ':pray:', ':raised_hands:'])
  }
})



// attach Slapp to express server
var server = slapp.attachToExpress(express())

// start http server
server.listen(port, (err) => {
  if (err) {
    return console.error(err)
  }

  console.log(`Listening on port ${port}`)
})
