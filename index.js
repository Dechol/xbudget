import express from 'express'
import bodyParser from'body-parser'
import mongoose, { Schema } from 'mongoose'
import 'dotenv/config'

const app = express()
const port = process.env.PORT || 3001
const idArray = []

//mongoose
mongoose.connect(process.env.MONGO_URI).then(()=>console.log('success fully logged into db'))
    .catch(err => console.log(err))

const tranSchema = new Schema({
    name:String,
    amount:Number,
    date:String,
},{timestamps:true})

const Tran = mongoose.model('Tran', tranSchema);

const t1 = new Tran({ name: 'gift', amount:200, date:new Date('2023-08-18').toDateString() });
const t2 = new Tran({ name: 'mcds', amount:134, date:new Date('2023-08-18').toDateString() });
const t3 = new Tran({ name: 'rootbeer', amount:30, date:new Date('2023-08-19').toDateString() });
const t4 = new Tran({ name: 'laundry', amount:40, date:new Date('2023-08-19').toDateString() });
const t5 = new Tran({ name: 'grabfood', amount:75, date:new Date('2023-08-19').toDateString() });
const t6 = new Tran({ name: 'signgh', amount:130, date:new Date('2023-08-19').toDateString() });

const daySchema = new Schema({
    date:String,
    total:Number,
    trans:[tranSchema],
})

const Day = mongoose.model('Day',daySchema)

const d1 = new Day({
    date:new Date('2023-08-18').toDateString(),
    total:0,
    trans:[t1,t2]
})
const d2 = new Day({
    date:new Date('2023-08-19').toDateString(),
    total:0,
    trans:[t3,t4,t5,t6]

})

//Add todays Day id to id array
async function onStartUp() {
    const today = new Date().toDateString()
    const doc = await Day.findOne({date:today})
    idArray.push(doc.id)
}
onStartUp()

// Day.insertMany([d1,d2]).then(()=>console.log('days inserted')).catch(err => console.log(err))




// Tran.insertMany([tran1,tran2]).then(console.log('success')).catch(err => console.log(err))



app.set('view engine','ejs')

app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))

const dayArrayTEST = [
    {date:'today', total:'x',items:['coke','food','laundry']},
    {date:'yesterday', total:'y',items:['grabfood']},
    {date:'day before', total:'z',items:['food','shopping']},
]


app.get('/', async(req, res) => {
    const trans = await Tran.find()
    const dayArray = await Day.find()
    dayArray.sort((a,b)=>{
        const date1 = new Date(a.date);
        const date2 = new Date(b.date);
        return date2 - date1;
    })
    res.render('index.ejs',{title:'home',trans, dayArray, idArray})
})
app.post('/',(req,res)=>{
    const newTran = new Tran({
        name: req.body.item,
        amount: req.body.cost,
        date: new Date().toDateString()
    })
    Day.findOne({date:newTran.date})
        .then((foundDay)=>{
            if(!foundDay){
                console.log('this day has not been found')
                const newDay = new Day({
                    date:newTran.date,
                    total:newTran.amount,
                    trans:newTran,
                })
                newDay.save().then(()=>{
                    console.log('day created')
                    res.redirect('/')
                }).catch(error => console.log(error))

            } else {
                console.log('Day found!')
                foundDay.total += newTran.amount
                foundDay.trans.push(newTran)
                foundDay.save()
                .then(()=>{
                    console.log('tran added')
                    res.redirect('/')
                })
                .catch(error => console.log(error))
            }
        })
        .catch(error => console.log(error))
    // tran.save().then(res.redirect('/')).catch(error => console.log(error))
})
app.post('/show',(req,res)=>{
    const dayId = req.body.dayID
    if(!idArray.includes(dayId)){
        idArray.push(dayId)
    }else{
        //remove id from array
        idArray.splice(idArray.indexOf(dayId), 1);
    }
    console.log(idArray)
    res.redirect('/')
})
app.post('/tran',(req,res)=>{
    Tran.findByIdAndDelete(req.body.tranID).then(res.redirect('/'))
})
app.post('/delete',(req,res)=>{
    const dayID = req.body.dayID
    const tranID = req.body.tranID

    Day.findByIdAndUpdate(dayID,{$pull:{trans:{_id: tranID}}})
        .then(res.redirect('/'))
        .catch(err => console.log(err))
})

app.get('/about', (req, res) => {
    res.render('about.ejs',{title:'about'})
})
app.get('/contact', (req, res) => {
    res.render('contact.ejs',{title:'contact'})
})
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})