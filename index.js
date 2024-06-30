const express = require('express');
const app = express();

const cookieparser = require('cookie-parser')
const session = require('express-session')


const client = require('mongodb').MongoClient;

client.connect('mongodb+srv://2111981299aman:chitkara@quiz.9jehy4j.mongodb.net/?retryWrites=true&w=majority')
    .then((data)=>{
        console.log('DataBase connected')
        dbinstance =  data.db('Login')
    })



app.use(cookieparser());

const oneday = 1000*60*60*24;

app.use(session({
    saveUninitialized:true,
    resave:true,
    secret:'sgdfmnbdsfh',
    cookie:{maxAge:oneday}
}))

app.use(express.static('public'))
app.use(express.urlencoded());

app.set('view engine','ejs')

app.get('/',(req,res)=>{
    res.render('index');
})

app.get('/login',(req,res)=>{
    res.render('login',{message:''});
})

app.get('/signup',(req,res)=>{
    res.render('signup',{message:''})
})


app.get('/users/dashboard',(req,res)=>{
    if(req.session.rollno)
    res.render('dashboard',{name:req.session.name})
    else res.redirect('/')
})

app.get('/users/profile',(req,res)=>{
    if(req.session.rollno) res.render('profile',{name:req.session.name,rollno:req.session.rollno,age:req.session.age,gender:req.session.gender,attempts:req.session.attempts,highScore:req.session.highScore})
    else res.redirect('/');
})

app.get('/users/logout',(req,res)=>{
    req.session.destroy();
    res.redirect('/');
})

app.get('/users/startQuiz',(req,res)=>{
    if(req.session.rollno) {
        let x = req.session.index;
        dbinstance.collection('questions').find({'index':x}).toArray()
            .then((response)=>{
                if(response.length == 0){
                    req.session.attempts = req.session.attempts+1;
                    req.session.index = 0;
                    req.session.currScore  = 0;
                    //console.log(req.session.rollno , " dfvjk " , req.session.highScore , " jfdhvjv " , req.session.attempts );
                    dbinstance.collection('users').updateOne({'rollno':req.body.rollno},{$set:{highScore:req.session.highScore,attempts:req.session.attempts}});
                    res.redirect('/users/profile');
                }
                else{
                    req.session.correctAnswer = response[0].correctAnswer;
                    res.render('startQuiz',{name:req.session.name,highScore:req.session.highScore,attempts:req.session.attempts,
                        question:response[0].question,option1:response[0].options[0],option2:response[0].options[1],option3:response[0].options[2],option4:response[0].options[3]})
                }
            })   
    }
    else res.redirect('/');

})

app.post('/users/startQuiz/nextQuestion', (req, res) => {
    //console.log(req.body , "  asjdb " , req.session.correctAnswer);
    if(req.body.option==req.session.correctAnswer){
        req.session.currScore = req.session.currScore + 1;
        if(req.session.highScore < req.session.currScore){
            req.session.highScore = req.session.currScore;
        }
    }
    console.log(req.session.currScore);
    req.session.index = req.session.index+1;
    res.redirect('/users/startQuiz');

})

app.post('/login',(req,res)=>{
    dbinstance.collection('users').find({'rollno':req.body.rollno}).toArray()
        .then((response)=>{
            if(response.length==0){
                console.log('Invalid');
                res.render('signup',{message:'Invalid user --- PLEASE SIGNUP'})
            }else if(response[0].password!=req.body.password){
                console.log('Invalid');
                res.render('login',{message:'Invalid password --- PLEASE RETRY'})
            }else{
                console.log('Welcome')
                req.session.name = response[0].name;
                req.session.rollno = response[0].rollno;
                req.session.age = response[0].age;
                req.session.gender = response[0].gender;
                req.session.attempts = response[0].attempts;
                req.session.highScore = response[0].highScore;
                req.session.currScore = response[0].currScore;
                req.session.index = 0;
                req.session.correctAnswer = "null";
                res.redirect('/users/dashboard')
            }
        })
})

app.post('/signup',(req,res)=>{
    let obj= {'password':req.body.password,'name':req.body.name,'rollno':req.body.rollno,'age':req.body.age,'gender':req.body.gender, 'attempts': 0 , 'highScore' : 0,'currScore' : 0};

    dbinstance.collection('users').find({'rollno':req.body.rollno}).toArray()
        .then((response)=>{
            if(response.length==0){
                dbinstance.collection('users').insertOne(obj)
                .then((user)=>{
                    console.log('Record Inserted');
                    res.render('login',{message:'Account Created --- PLEASE LOGIN'})
                })
            }else{
                res.render('login',{message:'Account already exist --- PLEASE LOGIN'})
            }
        })
})

app.listen(4000,(err)=>{
    console.log('Server Started...');
})
