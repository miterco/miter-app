import cors from 'cors';

const {CORS_ALLOWED_ORIGINS} = process.env;
const AllowedOrigins: string[] = (CORS_ALLOWED_ORIGINS || '*').split(',');

export default cors({
  origin: (origin, cb) => {
    // Only allow request from origins if they are in the origins whitelist or if the wildcard
    // Is in the whitelist.
    if (AllowedOrigins.includes('*') || (origin && AllowedOrigins.includes(origin))) {
      return cb(null, true);
    }

    cb(new Error('Not allowed by CORS'));
  },
});
