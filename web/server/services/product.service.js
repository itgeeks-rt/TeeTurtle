import shopify from "../../shopify.js"

export const getProductList = async (req, res, session) => {
  const {cursorAfter,cursorBefore,sortKey = "TITLE",sortBy=""} = req.body;
  let searchQuery = req.body?.searchQuery || ""
  console.log("new key --",sortBy);
  sortBy ? searchQuery=`${sortBy}:'${searchQuery}'` :null
  console.log("new key --",searchQuery);

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
              media(first:1){
              edges{
              node{
              id
                  }
                   }
             }
              image {
                url
              }
              media(first:1) {
                edges {
                  node {
                    id
                  }
                }
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

  const { productIdList, imageUrlList } = req.body;
  const newList = imageUrlList.map((url) => ({
    alt: "Image",
    mediaContentType: "IMAGE",
    originalSource: url,
  }));

  const product_create_media = `mutation productCreateMedia($media: [CreateMediaInput!]!, $productId: ID!) {
  productCreateMedia(media: $media, productId: $productId) {
    media {
      id
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

const variant_append_media_mutaion=`mutation productVariantAppendMedia($productId: ID!, $variantMedia: [ProductVariantAppendMediaInput!]!) {
  productVariantAppendMedia(productId: $productId, variantMedia: $variantMedia) {
    product {
      id
    }
    userErrors {
      code
      field
      message
    }
  }
}`

const variant_detach_media_mutation=`mutation productVariantDetachMedia($productId: ID!, $variantMedia: [ProductVariantDetachMediaInput!]!) {
  productVariantDetachMedia(productId: $productId, variantMedia: $variantMedia) {
    product {
      id
    }
  }
}`


    const client = new shopify.api.clients.Graphql({ session });
    const allPromises = productIdList.map(async (obj) => {
    const responseData = await client.request(product_create_media, {
      variables: {
        "media": newList,
        "productId": obj.productId,
      }
    })
    let variantDetachMediaResponse
    let  variantResponse ;
   if(obj?.variantsIds?.length){
  
    // console.log(obj);

    const productId=obj.productId
    const mediaList=responseData.data.productCreateMedia.media
    await new Promise(resolve => setTimeout(resolve, 1500));

   const isMediaReady= await checkMediaStatus(productId,mediaList,client);

   if(!isMediaReady){
    return false
   }

  const mediaIdList=responseData.data.productCreateMedia.media.map((media) => {
    return media.id
  });

    const variantMedia = obj.variantsIds.map(variantId => {
      return  {
        "mediaIds": mediaIdList,
        "variantId": variantId.split("__")[0]
      }  
      });
      const variantsVariables={
        "productId":obj.productId,
        "variantMedia":variantMedia
  
      }

      const variantDetachMedia = obj.variantsIds
      .filter((variantId) => {
        return variantId.split("__")[1] !== "undefined";
      })
      .map((variantId) => {
        return {
          mediaIds: variantId.split("__")[1],
          variantId: variantId.split("__")[0],
        };
      });
    
      if(variantDetachMedia.length){

        const variantsDetachVariables={
          "productId":productId,
          "variantMedia":variantDetachMedia
    
        }
        variantDetachMediaResponse=await client.request(variant_detach_media_mutation,{
          variables:variantsDetachVariables
        })
        console.log("variantDetachMediaResponse--",variantDetachMediaResponse.data.productVariantDetachMedia.product);

        

      }

  
    // console.log("variant variables----",variantsVariables.variantMedia[0].mediaIds);
      variantResponse = await client.request(variant_append_media_mutaion, {
      variables:variantsVariables
    })
   }

  //  console.log("variant error--",variantResponse?.data?.productVariantAppendMedia?.userErrors );

    if (responseData.data.productCreateMedia.mediaUserErrors.length > 0  ) {
      return false
    }
    return responseData;
  });

  const responses = await Promise.all(allPromises)


  if (responses.includes(false)) {
    console.log("error in image upload",responses.data);
    return false
  }
  return true

}

const checkMediaStatus=async (productId,mediaList,client)=>{
  const count = mediaList.length

  const query=`query MyQuery {
  product(id: "${productId}") {
    media(first: ${count}, reverse: true) {
      edges {
        node {
          id
          status
        }
      }
    }
  }
}`

const responseData = await client.request(query)
let list=[]
responseData.data.product.media.edges.forEach(media => {
  list.push(media.node.status)  
});


if(list.includes("FAILED")){
  console.log("status failed");
  return false ;
}
else if(list.includes("PROCESSING") ) {
  console.log("trying again...");
checkMediaStatus(productId,mediaList,client)
}
else{
  console.log(list);
console.log(responseData.data.product.media.edges);
  return true ;
}


}