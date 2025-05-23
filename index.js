const express = require('express')
const app = express()
const mongoose = require('mongoose')
const cors = require('cors')
const bodyParser = require('body-parser')
require('dotenv').config()

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

// Schemas
const exerciseSchema = new mongoose.Schema({
  username: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: Date
})

const userSchema = new mongoose.Schema({
  username: { type: String, required: true }
})

// Models
let Exercise = mongoose.model('Exercise', exerciseSchema);
let User = mongoose.model('User', userSchema);

// Middleware
app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false}));

// Routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// CREATE
app.post('/api/users', async (req, res) => {
  const newUser = new User({ username: req.body.username });
  await newUser.save();
  res.json({username: req.body.username, _id: newUser._id});
})

app.post('/api/users/:_id/exercises', async (req, res) => {
  const user = await User.findById(req.params._id).exec();
  let date = new Date();
  if (req.body.date){
    date = new Date(req.body.date);
  }
  const newExercise = new Exercise({
    username: user.username,
    description: req.body.description,
    duration: req.body.duration,
    date: date
  })
  await newExercise.save();
  const exercise = await Exercise.findById(newExercise._id).exec();
  res.json({
    username: user.username,
    _id: user._id,
    description: exercise.description,
    duration: exercise.duration,
    date: new Date(exercise.date).toDateString()
  })
})

// READ
app.get('/api/users', async (req, res) => {
  const users = await User.find({}).exec();
  const userList = users.map(user => {
    return {username: user.username, _id: user._id}
  })
  res.json(userList);
})

app.get('/api/users/:_id/logs', async ( req, res) => {
  const user = await User.findById(req.params._id).exec();
  const filter = {username: user.username}
  if (req.query.from && !req.query.to){
    filter.date = { $gte: new Date(req.query.from)}
  }
  if (req.query.to && !req.query.from){
    filter.date = { $lte: new Date(req.query.to)}
  }
  if (req.query.from && req.query.to){
    filter.date = { $gte: new Date(req.query.from), $lte: new Date(req.query.to)}
  }
  let query = Exercise.find(filter);
  if (req.query.limit){
    query = query.limit(req.query.limit);
  }
  const exercises = await query.exec();
  const exerciseList = exercises.map(exercise => {
    return {description: exercise.description, duration: exercise.duration, date: new Date(exercise.date).toDateString()}
  })

  res.json({
    username: user.username,
    count: exercises.length,
    _id: user._id,
    log: exerciseList
  })
})

// UPDATE


// DELETE



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
