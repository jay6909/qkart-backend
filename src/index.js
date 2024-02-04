const mongoose = require("mongoose");
const app = require("./app");
const config = require("./config/config");

mongoose.connect(config.mongoose.url).then(() => {
    console.log("Connected to MongoDB");

    app.listen(config.port,()=>{
        console.log(`Server is running on port ${config.port}`)
    })
}).catch((error)=> console.log(error.message));



// TODO: CRIO_TASK_MODULE_UNDERSTANDING_BASICS - Create Mongo connection and get the express app to listen on config.port
