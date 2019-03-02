module.exports = fetch => sdk =>
  sdk(
    async (url, data, headers) => {
      try {
        const response = await fetch(url, {
          headers,
          method: 'POST',
          body: JSON.stringify(data),
        });
        return response.json();
      } catch (error) {
        return error;
      }
    },
    async (url, data, headers) => {
      try {
        const response = await fetch(url, {
          headers,
          method: 'GET',
          body: JSON.stringify(data),
        });
        return response.json();
      } catch (error) {
        return error;
      }
    },
  );
