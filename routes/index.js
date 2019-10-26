const express = require('express');
const router = express.Router();

//POST /register.json?url={} 저장
//GET 해당 URL 검색후 이동
//


/* GET home page. */
router.get('/:id', async function (req, res) {
    const url_id = req.originalUrl;

    try {
        let sql = `SELECT * FROM redirect_url WHERE id = '${url_id.split("/")[1]}' ;`;
        var data = await execute_db(sql);

        if (data.length == 0) {
            throw {"isError":true,"msg":"요청하신 페이지가 존재하지 않습니다."};
        }

        sql = `INSERT INTO stats(redirect_url_index,visit_date) VALUES('${data[0].index}',NOW()) ;`;
        await execute_db(sql);

        res.statusCode = 301; 
        res.redirect(data[0].response_url);

    } catch (e) {
        if (e.isError) {
            res.send(e.msg);
        } else {
            res.send("Error");
        }        
    }
});

router.get('/:id/stats', async function (req, res) {
    const url_id = req.originalUrl;
    let rv = {};

    try {
        let sql = `SELECT * FROM redirect_url WHERE id = '${url_id.split("/")[1]}' ;`;
        let data = await execute_db(sql);

        if (data.length == 0) {
            throw { "isError": true, "msg": "요청하신 페이지가 존재하지 않습니다." };
        }

        sql = `SELECT DATE_FORMAT(visit_date, '%Y-%m-%d %H:00:00') AS at, COUNT(*) AS visits FROM stats WHERE redirect_url_index = '${data[0].index}' GROUP BY DATE_FORMAT(visit_date, '%Y-%m-%d %H') ORDER BY visit_date;`;
        let stats = await execute_db(sql);

        res.statusCode = 200; 
        rv = { "Stats": stats };
    } catch (e) {
        if (e.isError) {
            rv = e;
        } else {
            rv = { "isError": true, "msg": "오류가 발생했습니다." };
        }
    }

    res.setHeader('Content-Type', 'application/json');
    res.send(rv);
});

router.post('/register.json', async function (req, res) {
    const url = Get(req, "url");
    let rv = {};
    
    try {
        if (url == "") {
            throw { "isError": true, "msg": "값이 없습니다." };
        }

        let sql = `SELECT * FROM redirect_url WHERE response_url = '${url}' ;`;
        let data = await execute_db(sql);
        let rv_url = "";

        if (data.length == 0) {
            let id = random_id();
            res.statusCode = 201; 
            rv_url = "http://localhost:3000/" + id;
            sql = `INSERT INTO redirect_url(id,request_url, response_url) VALUES('${id}','${rv_url}','${url}') ;`;
            await execute_db(sql);
        } else {
            res.statusCode = 200; 
            rv_url = data[0].request_url;
        }
        
        rv = { "url": rv_url };
    } catch (e) {
        if (e.isError) {
            rv = e;
        } else {
            rv = { "isError": true, "msg": "오류가 발생했습니다." };
        }
    }
    
    res.setHeader('Content-Type', 'application/json');
    res.send(rv);
});




function execute_db(sql) {
    return new Promise((resolve, reject) => {
        _db.query(sql, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });    
}

function random_id() {
    let id = "";
    let text = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789";

    for (var i = 0; i < 10; i++) {
        id += text.substr(Math.floor(Math.random() * text.length), 1);
    }

    return id;
}

function Get(req, name) {
    var returnvalue = "";
    if (req.body[name] !== undefined) {
        returnvalue = req.body[name];
    }
    if (req.query[name] !== undefined) {
        returnvalue = req.query[name];
    }
    return returnvalue;
}

module.exports = router;
