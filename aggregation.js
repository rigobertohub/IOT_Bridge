var mqtt = require('mqtt');
const coap = require('coap');
const Stream = require('stream')
const EventEmitter = require('events')
const axios = require('axios')

class getProtocol {
    constructor(address, topic) {
        this.address = address;
        this.topic = topic;
        // Read the MQTT protocol 
        this.get_mqtt = function (callBack) {
            let readableStream = new Stream.Readable({
                objectMode: true
            });
            let client = mqtt.connect('mqtt://test.mosquitto.org'); //TODO: change connection address to the one being passed in arguments
            readableStream._read = () => { };
            callBack(readableStream);
            client.on('connect', () => {
                client.subscribe(this.topic);
                console.log("Topic subscribed!");
            });
            client.on('message', (t, m) => {
                readableStream.push({ topic: t, message: m });
            });
        };
        // Read the COAP protocol 
        this.get_coap = () => new Promise((resolve, reject) => {
            let request;
            let url = new URL(this.address);
            url.port = 5683;
            if (url.protocol != 'coap:') {
                reject("The url provided doesn't have protocol = coap")
            }
            request = coap.request(url)
            request.end();
            request.on('response', (res) => {
                let value = res.payload.toString();
                resolve(value);
            });
        })
        // Read the HTTP protocol 
        this.get_http = () => new Promise((resolve, reject) => {
            let input_url = new URL(this.address)
            input_url.port = 3001
            axios.get(input_url.href + this.topic) // TODO: remove topic ???
                .then(function (response) {
                    let res = (response.data).toString()
                    resolve(res)
                }).catch(function (error) {
                    reject(error.message)
                })
        })
    }
}

function ArrayAvg(myArray) {
    var i = 0, summ = 0, ArrayLen = myArray.length;
    while (i < ArrayLen) {
        summ = summ + myArray[i++];
}
    return summ / ArrayLen;
}

function dev(arr){
    // Creating the mean with Array.reduce
    let mean = arr.reduce((acc, curr)=>{
      return acc + curr
    }, 0) / arr.length;
     
    // Assigning (value - mean) ^ 2 to every array item
    arr = arr.map((k)=>{
      return (k - mean) ** 2
    })
     
    // Calculating the sum of updated array
   let sum = arr.reduce((acc, curr)=> acc + curr, 0);
    
   // Calculating the variance
   let variance = sum / arr.length
    
   // Returning the Standered deviation
   return Math.sqrt(sum / arr.length)
}

function aggregate(protocol,host,topic,number) {
    console.log("Starting aggregation ...")
    let n=[]
    let display = new getProtocol(host, topic)
    switch (protocol) {
        // Visualize MQTT
        case 'mqtt':
            console.log("Connecting to protocol MQTT")
            display.get_mqtt((read_stream) => {
                let data
                let t, m

                read_stream.on('readable', () => {
                        while (data = read_stream.read()) {
                            t = data.topic.toString()
                            m = data.message.toString()
                            console.log("Topic - "+ t +", Message : " + m)
                            n.push(Number(m))
                            if (n.length<number){
                                n = n.filter(function (value) {
                                    return !Number.isNaN(value);
                                });
                            } else{
                                console.log("Average: "+ ArrayAvg(n))
                                console.log("Min: "+ Math.max(...n))
                                console.log("Max: "+ Math.min(...n))
                                console.log("Standard Deviation: "+ dev(n))
                                n=[]
                            }
                        }                  
                })
            })
            break;

        // Visualize COAP
        case 'coap':
            let eventEmitterCoap = new EventEmitter()
            eventEmitterCoap.on('start', async () => {
                try {
                    if (n.length<number){
                        let prom =  display.get_coap();
                        prom.then(function(result) {
                            console.log(result) // Response
                            n.push(Number(result))
                            n = n.filter(function (value) {
                                return !Number.isNaN(value);
                            });
                            if (n.length==number){
                                console.log(n)
                                console.log("Average: "+ ArrayAvg(n))
                                console.log("Min: "+ Math.max(...n))
                                console.log("Max: "+ Math.min(...n))
                                console.log("Standard Deviation: "+ dev(n))
                                n=[]
                            }
                            })
                        await new Promise(resolve => setTimeout(resolve, 2000)) //Sleep 2 seconds before emiting new event
                        eventEmitterCoap.emit('start')

                    } 
                } catch (error) {
                    console.log("Coap error")
                    console.log(error)
                }
            })
            eventEmitterCoap.emit('start')
            break;    
            eventEmitterCoap.emit('start')
            break;

        // Visualize HTTP
        case 'http':
            let eventEmitterHttp = new EventEmitter()
            eventEmitterHttp.on('start', async () => {
                try {
                    if(n.length<number){
                        let res = await display.get_http() // Response
                        console.log(res)
                        n.push(Number(res))
                        n = n.filter(function (value) {
                            return !Number.isNaN(value);
                        });
                        if(n.length==number){
                            console.log("Average: "+ ArrayAvg(n))
                            console.log("Min: "+ Math.max(...n))
                            console.log("Max: "+ Math.min(...n))
                            console.log("Standard Deviation: "+ dev(n))
                            n=[]
                        }
                    await new Promise(resolve => setTimeout(resolve, 2000)) //Sleep 2 seconds before emiting new event
                    eventEmitterHttp.emit('start')
                    }
                   
                } catch (error) {
                    console.log("Http error")
                    console.log(error)
                }
            })
            eventEmitterHttp.emit('start')
            break
        default:
            break;
    }
}
module.exports = { aggregate };