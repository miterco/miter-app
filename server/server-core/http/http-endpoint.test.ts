import httpEndpoint from './http-endpoint';


test('httpEndpoint wrapper', () => {
  const fnWithError = jest.fn().mockRejectedValue(new Error('Oops'));
  const fn = jest.fn();

  // Test that the endpoint actually calls the wrapped function.
  expect(httpEndpoint(fn)).not.toThrow();
  expect(fn.mock.calls).toHaveLength(1);

  // Test that the endpoint wrapper handles the exception.
  expect(httpEndpoint(fnWithError)).not.toThrow();
  expect(fnWithError.mock.calls).toHaveLength(1);
});
