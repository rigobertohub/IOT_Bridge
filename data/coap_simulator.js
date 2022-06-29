var coap = require('coap')
server = coap.createServer()

server.on('request', (req, res) => {
    console.log("Request received..")
    temperature=((Math.random() * 3) + 21).toFixed(2).toString()
    res.end(temperature)
})

server.listen(()=> {
    console.log('COAP Server on Port 5683: Listening...')
})