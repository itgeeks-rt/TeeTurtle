import shopify from "../../shopify.js"
import axios from "axios"
import FormData from "form-data"
import fs from "fs"
import * as cheerio from 'cheerio';
import db from "../models/index.js";
import { Op } from "sequelize";
const product = db.productModel


export const uploadImage = async (req, res, session) => {


  // let bufferObj = Buffer.from(string, "base64");
  // console.log(bufferObj);


  const filename = req.body.filename


  if (!req.file || !req.file.buffer) {

    return {
      status: false,
      message: "There was missing File buffer"
    }

  }
  const staged_Uploads_Create_Mutation = `
  mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
  stagedUploadsCreate(input: $input) {
    stagedTargets {
      url
      resourceUrl
      parameters {
        name  
        value
      }
    }
  }
}
`;


  const client = new shopify.api.clients.Graphql({ session });

  const response = await client.request(staged_Uploads_Create_Mutation, {
    variables: {
      "input": [
        {
          "filename": filename,
          "mimeType": "image/jpg",
          "httpMethod": "POST",
          "resource": "IMAGE"
        }

      ]
    }
  });



  const target = response.data?.stagedUploadsCreate?.stagedTargets[0]

  if (!target) {
    return {
      status: false,
      message: "There was an error form shopify End"
    }
  }

  const parameters = target.parameters
  const URL = target.url

  const form = new FormData();

  for (let obj of parameters) {
    form.append(obj.name, obj.value)
  }


  // form.append('file', fs.createReadStream(req.file.path));
  form.append("file", req.file.buffer)


  console.log("form ----", form);

  const uploadRespose = await axios.post(URL, form, {
    headers: form.getHeaders(),
  });


  console.log("upload response---", uploadRespose);



  const $ = cheerio.load(uploadRespose.data);
  const url = $("location").text();
  console.log("url------------", url);

  if (!url) {
    return {
      status: false,
    }
  }


  const file_Create_Mutation = `mutation fileCreate($files: [FileCreateInput!]!) {
    fileCreate(files: $files) {
      files {
        id
        alt
        updatedAt
        createdAt
       preview{
       image{
       url
       }
       }
      }
      userErrors {
        field
        message
      }
    }
  }
  `



  const fileResponse = await client.request(file_Create_Mutation, {
    variables: {
      "files": [
        {
          "alt": filename,
          "contentType": "IMAGE",
          "originalSource": url
        }
      ]
    }

  });



  console.log(fileResponse.data.fileCreate.files[0]);


  const imageId = fileResponse.data.fileCreate.files[0].id
  const updatedAt = fileResponse.data.fileCreate.files[0].updatedAt
  const createdAt = fileResponse.data.fileCreate.files[0].createdAt

  const result = product.create({ productId: 9, imageId: imageId, imageURL: url, updatedAt: updatedAt, createdAt: createdAt })
  //  return fileResponse.data





  // console.log(form);
  return result

  // 

};


export const getImage = async (req, res, session) => {




  const imageId = req.body.imageId

  const get_image_query = `query {
    node(id: "${imageId}") {
      id
      ... on MediaImage {
        image {
          url
        }
           originalSource {
          url
        }
      }
    }
  }
  `

  const client = new shopify.api.clients.Graphql({ session });

  const response = await client.request(get_image_query);

  return response.data

}




export const deleteImage = async (req, res, session) => {




  const imageId = req.body.imageId

  const file_delete_Mutation = `mutation fileDelete($input: [ID!]!) {
  fileDelete(fileIds: $input) {
    deletedFileIds
  }
}
`

  const client = new shopify.api.clients.Graphql({ session });

  const response = await client.request(file_delete_Mutation, {
    variables: {
      "input": [

        `${imageId}`
      ]
    }

  });

  return response.data

}

export const productImage = async (req, res, session) => {




  // const imageId=req.body.imageId
  const originalSource = req.body.originalSource
  const productId = req.body.productId



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

  const response = await client.request(product_create_media, {
    variables: {
      "media": [

        {
          "alt": "Image",
          "mediaContentType": "IMAGE",
          "originalSource": originalSource
        }
      ],
      "productId": productId
    }



  });

  return response.data

}



export const getImageList = async (req, res, session) => {
  const { shop } = req.query;
  console.log("getImageList--API---shop--", shop);
  const page = parseInt(req.body.page) || 1
  const limit = parseInt(req.body.limit) || 5

  const offset = (page - 1) * limit

  const searchQuery = req.body?.searchQuery || ""

  const result = await product.findAndCountAll({
    offset: offset,
    limit: limit,
    where: {
      [Op.or]: [
        { category: { [Op.like]: '%' + searchQuery + '%' } },
        { imageName: { [Op.like]: '%' + searchQuery + '%' } }
      ]
    }

  });

  const pagination = {
    current_page: page,
    per_page: limit,
    count: result.count
  }

  result.pagination = pagination
  delete result.count;

  return result

}

