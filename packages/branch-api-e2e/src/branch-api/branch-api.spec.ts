import axios from 'axios';

describe('GET /', () => {
    it('should return deep-ping', async () => {
        const res = await axios.get(`/deep-ping`);

        expect(res.status).toBe(200);
        expect(res.data).toEqual({ message: 'ping' });
    });
});
