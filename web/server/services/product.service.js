import shopify from "../../shopify.js"

export const getProductList = async (req, res,session) => {

    const QUERY = `
  
`;

const client = new shopify.api.clients.Graphql({ session });

const response = await client.request(QUERY, {
  variables: "kj"
  
});




 
    
   return response
};