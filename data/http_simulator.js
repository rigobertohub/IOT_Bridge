const express = require('express')
const app = express()
const port = 3001
app.get('/'+'temperature', (req, res) => {
    temperature=((Math.random() * 10)+ 21).toFixed(2).toString()
    console.log("Request received..")
    res.set('Content-Type', 'text/plain')
    res.send(temperature) // TODO: change this randoms
})
app.listen(port, () => {
    console.log('HTTP on Port 3001.'+"\n"+
    `Listening at http://localhost:${port}/temperature...`)
})