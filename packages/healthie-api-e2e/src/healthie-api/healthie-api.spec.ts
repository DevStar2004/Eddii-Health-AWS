import axios from 'axios';

describe('GET /', () => {
    it('should return deep-ping', async () => {
        try {
            await axios.get(`/deep-ping`);
        } catch (err) {
            expect(err.response.status).toBe(403);
        }
    });
});
