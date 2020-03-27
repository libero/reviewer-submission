import clientConfig from '../src/client-config';
import axios from 'axios';

describe('Server Integration Tests', () => {
    it('it should fetch the config without a JWT token', async () => {
        const response = await axios.get('http://localhost:3000/config');
        const data = response.data ? response.data : null;
        expect(data.config).toBeTruthy();
        expect(data.config).toEqual(clientConfig);
    });
});
