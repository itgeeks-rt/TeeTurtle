import shopify from "../../shopify.js"

export const createCollection = async (req, res,session) => {

    const QUERY = `
  mutation createCollectionMetafields($input: CollectionInput!) {
    collectionCreate(input: $input) {
      collection {
        id
        title
        ruleSet {
          rules {
            column
            relation
            condition
          }
        }
        metafields(first: 3) {
          edges {
            node {
              id
              namespace
              key
              value
            }
          }
        }
      }
      userErrors {
        message
        field
      }
    }
  }
`;

const client = new shopify.api.clients.Graphql({ session });

const response = await client.request(QUERY, {
  variables: {
    input: {
      title: "New Gyn Collection",
      metafields: [
        {
          namespace: "my_field",
          key: "subtitle",
          type: "single_line_text_field",
          value: "Bold Colors",
        },
      ],
      ruleSet: {
        appliedDisjunctively: false,
        rules: [
          {
            column: "TAG",
            relation: "EQUALS",
            condition: "gym",
          },
        ],
      },
    },
  },
  headers: { myHeader: "1" },
  retries: 2,
});




 
    
   return response
};