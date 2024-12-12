import shopify from "../../shopify.js"

export const getProductList = async (req, res, session) => {

  const searchQuery = req.body.searchQuery || ""
  const cursorAfter = req.body.cursorAfter 
  const cursorBefore = req.body.cursorBefore

  const cursor =
    cursorAfter ?
      `first:10,query:"${searchQuery}",after:"${cursorAfter}"` :
      cursorBefore ?
        `last:10,query:"${searchQuery}",before:"${cursorBefore}"` :
        `first:10,query:"${searchQuery}"`;

const QUERY = `query {
  products(${cursor}) {
    edges {
      node {
        id
        title
       tags
        status
        category {
          fullName
        }
      }
      cursor
    }
    pageInfo {
        hasPreviousPage
      hasNextPage
    }
  }
}`;

  

  const client = new shopify.api.clients.Graphql({ session });

  const response = await client.request(QUERY);

  return response
};

export const uploadProductImage = async (req, res, session) => {


  // const imageId=req.body.imageId
  const originalSource = req.body.originalSource
  const productId = [1,2,3,4,5]


  const product_create_media = `mutation productCreateMedia($media: [CreateMediaInput!]!, $productId: ID!) {
  productCreateMedia(media: $media, productId: $productId) {
    media {
      alt 
      mediaContentType
      status
    }
    mediaUserErrors {
      field
      message
    }
    product {
      id
      title
    }
  }
}
`

  const client = new shopify.api.clients.Graphql({ session });


 productId.forEach(async (id) => {

  response = await client.request(product_create_media, {
    variables: {
      "media": [
        {
          "alt": "Image",
          "mediaContentType": "IMAGE",
          "originalSource": originalSource
        }
      ],
      "productId": id
    }
 })
 

})
}


// export const uploadProductImage = async (req, res, session) => {


//   // const imageId=req.body.imageId
//   const originalSource = req.body.originalSource
//   const productId = req.body.productId


//   const product_create_media = `mutation productCreateMedia($media: [CreateMediaInput!]!, $productId: ID!) {
//   productCreateMedia(media: $media, productId: $productId) {
//     media {
//       alt 
//       mediaContentType
//       status
//     }
//     mediaUserErrors {
//       field
//       message
//     }
//     product {
//       id
//       title
//     }
//   }
// }
// `

//   const client = new shopify.api.clients.Graphql({ session });

//   const response = await client.request(product_create_media, {
//     variables: {
//       "media": [

//         {
//           "alt": "Image",
//           "mediaContentType": "IMAGE",
//           "originalSource": originalSource
//         }
//       ],
//       "productId": productId
//     }



//   });

//   return response.data

// }

