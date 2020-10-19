/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

let threadId1;
let threadId2;

let replyId1;
let replyId2;

suite('Functional Tests', function() {

  suite('API ROUTING FOR /api/threads/:board', function() {
    
    /*
    I can POST a thread to a specific message board by passing form data text and deletepassword to /api/threads/{board}.(Recommend res.redirect to board page /b/{board}) Saved will be at least _id, text, createdon(date&time), bumpedon(date&time, starts same as created_on), reported(boolean), deletepassword, & replies(array).
    */
    suite('POST', () => {
      test("create two threads", done => {
        chai.request(server)
          .post('/api/threads/myBoardName')
          .send({text: "This is a test text", deletepassword: "please delete me"})
          .end((err, res) => {
            if(err) throw err;
            assert.equal(res.status, 200);

            // we should move this to promises
            chai.request(server)
              .post('/api/threads/myBoardName')
              .send({text: "This is the second test text", deletepassword: "dont delete me"})
              .end((err, res) => {
                if(err) throw err;
                assert.equal(res.status, 200);
                
                done();
              });
          });
      });
    });
    
    /*
    I can GET an array of the most recent 10 bumped threads on the board with only the most recent 3 replies each from /api/threads/{board}. The reported and deletepasswords_ fields will not be sent to the client.
    */
    suite('GET', () => {
      test("get 10 recent threads", done => {
        chai.request(server)
          .get("/api/threads/myBoardName")
          .end((err, res) => {
            if(err) throw err;
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.isAtMost(res.body.length, 10);
            assert.isArray(res.body[0].replies);
            assert.isAtMost(res.body[0].replies.length, 3);
            assert.property(res.body[0], "created_on");
            assert.property(res.body[0], "bumped_on");
            assert.notProperty(res.body[0], "reported");
            assert.notProperty(res.body[0], "deletepassword");
            threadId1 = res.body[0]._id;
            threadId2 = res.body[1]._id;
            done();
          });
      });
    });
    
    /*
    I can delete a thread completely if I send a DELETE request to /api/threads/{board} and pass along the threadid & deletepassword. (Text response will be 'incorrect password' or 'success')
    */
    suite('DELETE', () => {
      test("delete thread with wrong password", done => {
        chai.request(server)
          .delete("/api/threads/myBoardName")
          .send({threadid: threadId1, deletepassword: "wrongpassword"})
          .end((err, res) => {
            if(err) throw err;
            assert.equal(res.status, 200);
            assert.equal(res.text, "incorrect password");
            done();
          });
      });

      test("delete thread with good password", done => {
        chai.request(server)
          .delete("/api/threads/myBoardName")
          .send({threadid: threadId1, deletepassword: "please delete me"})
          .end((err, res) => {
            if(err) throw err;
            assert.equal(res.status, 200);
            assert.equal(res.text, "success");
            done();
          });
      })
    });
    
     /*
    I can report a thread and change its reported value to true by sending a PUT request to /api/threads/{board} and pass along the threadid_. (Text response will be 'success')
    */
    suite('PUT', () => {
      test("report thread", done => {
        chai.request(server)
          .put("/api/threads/fcc")
          .send({threadid: threadId2})
          .end((err, res) => {
            if(err) throw err;
            assert.equal(res.status, 200);
            assert.equal(res.text, "success");
            done();
          });
      });
    });
    

  });
  
  suite('API ROUTING FOR /api/replies/:board', function() {
    
    /*
    I can POST a reply to a thread on a specific board by passing form data text, deletepassword, & threadid to /api/replies/{board} and it will also update the bumpedon date to the comments date.(Recommend res.redirect to thread page /b/{board}/{thread_id}) In the thread's replies array will be saved _id, text, createdon, deletepassword_, & reported.
    */
    suite('POST', function() {
      test("post two replies (one is going to get deleted)", done => {
        chai.request(server)
          .post("/api/replies/myBoardName")
          .send({threadid: threadId2, deletepassword: "delete", text: "This is a test text!"})
          .end((err, res) => {
            if(err) throw err;
            assert.equal(res.status, 200);

            chai.request(server)
              .post("/api/replies/myBoardName")
              .send({threadid: threadId2, deletepassword: "delete", text: "This is a test text!"})
              .end((err, res) => {
                if(err) throw err;
                assert.equal(res.status, 200);
                done();
              });

          });
      });
    });

    /*
    I can GET an entire thread with all its replies from /api/replies/{board}?thread_id={thread_id}. Also hiding the same fields the client should be see.
    */
    suite('GET', function() {
      test("get all replies of a thread", done => {
        chai.request(server)
          .get("/api/replies/myBoardName")
          .query({threadid: threadId2})
          .end((err, res) => {
            if(err) throw err;
            assert.equal(res.status, 200);
            assert.property(res.body, "created_on");
            assert.property(res.body, "bumped_on");
            assert.notProperty(res.body, "reported");
            assert.notProperty(res.body, "deletepassword");
            assert.isArray(res.body.replies);
            assert.isAtLeast(res.body.replies.length, 2);
            assert.property(res.body.replies[0], "text");
            assert.property(res.body.replies[0], "created_on");
            replyId1 = res.body.replies[0]._id;
            replyId2 = res.body.replies[1]._id;
            done();
          });
      })
    });

    /*
    I can report a reply and change its reported value to true by sending a PUT request to /api/replies/{board} and pass along the threadid & replyid. (Text response will be 'success')
    */
    suite('PUT', function() {
      test("report reply", done => {
        chai.request(server)
          .put("/api/replies/myBoardName")
          .send({threadid: threadId2, replyid: replyId2})
          .end((err, res) => {
            if(err) throw err;
            assert.equal(res.status, 200);
            assert.equal(res.text, "success");
            done();
          });
      })
    });

    /*
    I can delete a post(just changing the text to '[deleted]' instead of removing completely like a thread) if I send a DELETE request to /api/replies/{board} and pass along the threadid, replyid, & deletepassword_. (Text response will be 'incorrect password' or 'success')
    */
    suite('DELETE', function() {
      test("delete a reply with wrong password", done => {
        chai.request(server)
          .delete("/api/replies/myBoardName")
          .send({threadid: threadId2, replyid: replyId1, deletepassword: "wrong password"})
          .end((err, res) => {
            if(err) throw err;
            assert.equal(res.status, 200);
            assert.equal(res.text, "incorrect password");
            done();
          });
      });

      test("delete a reply with correct password", done => {
        chai.request(server)
          .delete("/api/replies/myBoardName")
          .send({threadid: threadId2, replyid: replyId1, deletepassword: "delete"})
          .end((err, res) => {
            if(err) throw err;
            assert.equal(res.status, 200);
            assert.equal(res.text, "success");
            done();
          });
      });
    });
    
  });

});
