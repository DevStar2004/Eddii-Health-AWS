import axios from 'axios';

describe('GET /', () => {
    it('should return 401 for deep-ping for user credentials', async () => {
        try {
            await axios.get(`/deep-ping`);
        } catch (err) {
            expect(err.response.status).toBe(401);
        }
    });
});
