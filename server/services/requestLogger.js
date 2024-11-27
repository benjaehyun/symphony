exports.requestLogger = (req, res, next) => {
    console.log('\n=== New Request ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Method:', req.method);
    console.log('URL:', req.originalUrl);
    console.log('Query:', req.query);
    console.log('Body:', req.body);
    console.log('Headers:', {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent'],
      'cookie': req.headers.cookie ? 'Present' : 'Missing',
      'origin': req.headers.origin,
      'referer': req.headers.referer
    });
    next();
  };