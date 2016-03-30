import api from '~/utils/singleton_api';

export default {
  get() {
    return api.get('templates')
    .then((response) => {
      return response.json.rows;
    });
  }
};
