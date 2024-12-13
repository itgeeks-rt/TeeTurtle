import shopify from "../../shopify.js"

export const getProductList = async (req, res, session) => {

  const searchQuery = req.body.searchQuery || ""
  const cursorAfter = req.body.cursorAfter
  const cursorBefore = req.body.cursorBefore
  const sortKey=req.body.sortKey || "TITLE"

  const cursor =
    cursorAfter ?
      `first:10,query:"${searchQuery}",after:"${cursorAfter}",sortKey:${sortKey}` :
      cursorBefore ?
        `last:10,query:"${searchQuery}",before:"${cursorBefore}",sortKey:${sortKey}` :
        `first:10,query:"${searchQuery}",sortKey:${sortKey}`;
    

const QUERY = `query {
  products(${cursor}) {
    edges {
      node {
        id
        title
        featuredMedia {
          preview {
            image {
              url
            }
          }
        }
        variants(first: 250) {
          edges {
            node {
              id
              title
              image {
                url
              }
            }
          }
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

  const productIdList = req.body.productIdList
  const imageUrlList = req.body.imageUrlList
  const newList = imageUrlList.map((url) => ({
    alt: "Image",
    mediaContentType: "IMAGE",
    originalSource: url,
  }));

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
  const allPromises = productIdList.map(async (id) => {
    const responseData = await client.request(product_create_media, {
      variables: {
        "media": newList,
        "productId": id
      }
    })

    if (responseData.data.productCreateMedia.mediaUserErrors.length > 0) {
      return false
    }
    return responseData;
  });

  const responses = await Promise.all(allPromises)
  if (responses.includes(false)) {
    return false
  }
  return true

}