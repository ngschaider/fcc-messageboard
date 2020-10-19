/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

const mongoose = require("mongoose");


// Getting started: https://mongoosejs.com/docs/index.html
mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true});

// https://mongoosejs.com/docs/2.7.x/docs/embedded-documents.html
const replySchema = new mongoose.Schema({
  text: String,
  created_on: {type: Date, default: Date.now},
  deletepassword: String,
  reported: {type: Boolean, default: false}
});

const Reply = mongoose.model("Reply", replySchema);

// https://mongoosejs.com/docs/tutorials/dates.html
const threadSchema = new mongoose.Schema({
  board: String,
  replies: [],
  created_on: {type: Date, default: Date.now},
  bumped_on: {type: Date, default: Date.now},
  deletepassword: String,
  replies: [replySchema],
  reported: {type: Boolean, default: false}
});

const Thread = mongoose.model("Thread", threadSchema);

if(process.env.NODE_ENV === "test") {
  Thread.remove({}, err => { 
    if(err) throw err;
    console.log("Thread collection removed in order to ensure clean test start.");
  });
}

module.exports = function (app) {
  
  app.route('/api/threads/:board')
  /*
  I can POST a thread to a specific message board by passing form data text and delete_password to /api/threads/{board}.(Recomend res.redirect to board page /b/{board}) Saved will be _id, text, created_on(date&time), bumped_on(date&time, starts same as created_on), reported(boolean), delete_password, & replies(array).
  */
    .post((req, res) => {
      const board = req.params.board;
      const text = req.body.text;
      const deletepassword = req.body.deletepassword;

      const thread = new Thread({
        board,
        text,
        deletepassword,
      });
      thread.save((err) => {
        if(err) throw err;
        res.redirect("/b/" + board);
      });
    })
  /*
  I can GET an array of the most recent 10 bumped threads on the board with only the most recent 3 replies each from /api/threads/{board}. The reported and deletepasswords_ fields will not be sent to the client.
  */
    .get((req, res) => {
      const board = req.params.board;
      Thread.find({board: board}).sort("bumped_on").limit(10).exec((err, threads) => {
        if(err) throw err;
        threads = threads.map(x => {
          const doc = x._doc
          const copy = {...doc};
          delete copy.deletepassword;
          delete copy.reported;
          return copy;
        });

        const replies = [];
        threads.forEach(thread => {
          const replies = [];
          thread.replies.forEach((reply, index) => {
            if(index < 3) {
              replies.push(reply);
            }
          });
          thread.replies = replies;
        });
        
        res.json(threads);
      });
    })
  /*
  I can delete a thread completely if I send a DELETE request to /api/threads/{board} and pass along the threadid & deletepassword. (Text response will be 'incorrect password' or 'success')
  */
    .delete((req, res) => {
      const id = req.body.threadid;
      const deletepassword = req.body.deletepassword;

      Thread.findOne({ _id: id }, (err, thread) => {
        if(err) throw err;
        if(thread.deletepassword == deletepassword) {
          Thread.deleteOne({ _id: id }, err => {
            if(err) throw err;
            res.send("success");
          });
        } else {
          res.send("incorrect password");
        }
      })
    })
  /*
  I can report a thread and change its reported value to true by sending a PUT request to /api/threads/{board} and pass along the threadid_. (Text response will be 'success')
  */
    .put((req, res) => {
      const board = req.params.board;
      const threadid = req.query.threadid_;
      Thread.findOneAndUpdate({_id: threadid}, {reported: true}, (err, thread) => {
        res.send("success");
      });
    })
    
  app.route('/api/replies/:board')
  /*
  I can POST a reply to a thread on a specific board by passing form data text, deletepassword, & threadid to /api/replies/{board} and it will also update the bumpedon date to the comments date.(Recommend res.redirect to thread page /b/{board}/{thread_id}) In the thread's replies array will be saved _id, text, createdon, deletepassword_, & reported.
  */
    .post((req, res) => {
      const board = req.params.board;
      const threadid = req.body.threadid;
      const text = req.body.text;
      const deletepassword = req.body.deletepassword;

      const reply = new Reply({
        text, 
        deletepassword
      });

      Thread.updateOne({_id: threadid}, {
        bumpedon: Date.now,
        $push: {replies: reply}
      }, (err, thread) => {
        if(err) throw err;
        res.redirect("/b/" + board + "/" + threadid);
      });
    })
  /*
  I can GET an entire thread with all its replies from /api/replies/{board}?thread_id={thread_id}. Also hiding the same fields the client should be see.
  */
    .get((req, res) => {
      const threadid = req.query.threadid;
      console.log(threadid);
      Thread.findOne({_id: threadid}).select("-reported -deletepassword").exec((err, thread) => {
        thread.replies = thread.replies.map(x => {
          const copy = {...x};
          delete copy.deletepassword;
          delete copy.reported;
          return copy;
        });
        res.json(thread);
      });
    })
  /*
  I can delete a post(just changing the text to '[deleted]' instead of removing completely like a thread) if I send a DELETE request to /api/replies/{board} and pass along the threadid, replyid, & deletepassword_. (Text response will be 'incorrect password' or 'success')
  */
    .delete((req, res) => {
      const deletepassword = req.body.deletepassword;
      const threadid = req.body.threadid;
      const replyid = req.body.replyid;

      console.log("trying to delete " + threadid + "/" + replyid + " with password " + deletepassword);
      Thread.findOne({_id: threadid}, (err, thread) => {
        if(err) throw err;
        if(thread.replies.id(replyid).deletepassword == deletepassword) {
          thread.replies.id(replyid).text = "[deleted]";
          thread.save(err => {
            if(err) throw err;
            res.send("success");
          });
        } else {
          res.send("incorrect password");
        }
      })
    })
  /*
  I can report a reply and change its reported value to true by sending a PUT request to /api/replies/{board} and pass along the threadid & replyid. (Text response will be 'success')
  */
    .put((req, res) => {
      const threadid = req.body.threadid;
      const replyid = req.body.replyid;
      Thread.findOne({_id: threadid}, (err, thread) => {
        if(err) throw err;
        thread.replies.id(replyid).reported = true;
        thread.save(err => {
          if(err) throw err;
          res.send("success");
        });
      });
    })

};
