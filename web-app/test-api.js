const http = require('http');

const loginData = JSON.stringify({
  correoElectronico: "gerente@hotelcervera.com",
  contrasena: "123"
});

const req = http.request({
  hostname: 'localhost',
  port: 8080,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log("LOGIN STATUS:", res.statusCode);
    if (res.statusCode === 200) {
      const token = JSON.parse(body).token;
      
      const req2 = http.request({
        hostname: 'localhost',
        port: 8080,
        path: '/api/precios-historicos',
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + token
        }
      }, (res2) => {
        let body2 = '';
        res2.on('data', chunk => body2 += chunk);
        res2.on('end', () => {
          console.log("PRECIOS STATUS:", res2.statusCode);
          console.log("PRECIOS JSON:", body2);
        });
      });
      req2.end();
    } else {
      console.log("LOGIN BODY:", body);
    }
  });
});
req.write(loginData);
req.end();
