import shopify from "../../shopify.js"
import axios from "axios"
import FormData from "form-data"
import fs from "fs"
import * as cheerio from 'cheerio';
import db from "../models/index.js";
import { Op } from "sequelize";
const image_template = db.image_template
const personalized_image = db.personalized_image
const Sequelize=db.Sequelize


export const uploadImage = async (req, res, session) => {

  const imageName = req.body.imageName
  const category = req.body.category
  const fileBase64 = req.body.fileBase64
  const colorName = req.body.colorName
  const isPersonalized = req.body.personalized

  const isLogoUploaded =  uploadLogo(req,res,session);

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
          "filename": imageName,
          "mimeType": "image/jpg",
          "httpMethod": "POST",
          "resource": "IMAGE"
        }

      ]
    }
  });

  const target = response.data?.stagedUploadsCreate?.stagedTargets[0]

  if (!target) {
    return false
  }

  const parameters = target.parameters
  const URL = target.url
  const form = new FormData();

  for (let obj of parameters) {
    form.append(obj.name, obj.value)
  }

  let bufferObj = Buffer.from(fileBase64, "base64");

  // let bufferObj = fs.createReadStream(req.file.path);

  form.append("file", bufferObj)

  const uploadRespose = await axios.post(URL, form, {
    headers: {
      ...form.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    },
  });

  const $ = cheerio.load(uploadRespose.data);
  const url = $("location").text();

  if (!url) {
    return false
  }

  const file_Create_Mutation = `mutation fileCreate($files: [FileCreateInput!]!) {
    fileCreate(files: $files) {
      files {
        id
        alt
        updatedAt
        createdAt
        fileStatus
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
          "alt": imageName,
          "contentType": "IMAGE",
          "originalSource": url
        }
      ]
    }
  });

  console.log(fileResponse.data.fileCreate.files[0]);

  const fileStatus = fileResponse?.data?.fileCreate?.files[0]?.fileStatus;

  if (fileStatus === "UPLOADED") {

    const imageId = fileResponse.data.fileCreate.files[0].id
    const updatedAt = fileResponse.data.fileCreate.files[0].updatedAt
    const createdAt = fileResponse.data.fileCreate.files[0].createdAt
    const data = await getImageStatus(req, res, session, imageId);

    if (!data) {
      return false;

    }

    console.log("data -is", data);

    if (isPersonalized) {
      const result = personalized_image.create({
        imageId: imageId,
        imageURL: data.node?.image?.url,
        updatedAt: updatedAt,
        createdAt: createdAt,
        category: category,
        imageName: imageName,
        colorName: colorName,
        logoUrl: isLogoUploaded,
      })

      return result


    }
    else {
      const result = image_template.create({
        imageId: imageId,
        imageURL: data.node?.image?.url,
        updatedAt: updatedAt,
        createdAt: createdAt,
        category: category,
        imageName: imageName,
        colorName: colorName,
      })

      return result

    }
  }
  else {
    return false
  }
};


const getImageStatus = async (req, res, session, imageId) => {
  const getStatus = async () => {
    const get_image_query = `query {
      node(id: "${imageId}") {
        id
        ... on MediaImage {
          status
          image {
            url
          }
          originalSource {
            url
          }
            fileErrors {
        code
        details
        message
      }
        }
      }
    }`;

    const client = new shopify.api.clients.Graphql({ session });
    const response = await client.request(get_image_query);

    console.log(response.data);

    const status = response.data?.node?.status;
    console.log("Image status---", status);

    if (status === "FAILED") {
      return false
    }
    else if (status !== "READY" || status === "PROCESSING") {
      console.log("Status is  not READY trying again ");
      await new Promise((resolve) => setTimeout(resolve, 500));
      return await getStatus();
    }
    return response.data;
  };
 
  await new Promise((resolve) => setTimeout(resolve, 1000));
 
  return await getStatus();
};


export const deleteImage = async (req, res, session) => {

  const imageId = req.body.imageId
  const isPersonalized = req.body.personalized

  const file_delete_Mutation = `mutation fileDelete($input: [ID!]!) {
  fileDelete(fileIds: $input) {
    deletedFileIds
     userErrors {
        code
        field
        message
      }
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

  if(isPersonalized){
    const result = personalized_image.destroy({ where: { imageId } })
  return result
  }
  else{
    const result = image_template.destroy({ where: { imageId } })
  return result
  }

}



export const getImageList = async (req, res, session) => {

  const page = parseInt(req.body.page) || 1
  const limit = parseInt(req.body.limit) || 5
  const offset = (page - 1) * limit
  const searchQuery = req.body?.searchQuery || ""
  const isPersonalized = req.body.personalized
  const category = req.body.category === "empty" ? "" : req.body.category
  const color = req.body.color === "empty" ? "" : req.body.color

  const finder = category && color ?
      {
        colorName: color,
       category: category
      } :
    category ? 
    {
      category: category
    } : 
    color ?
     {
      colorName: color
    } :
     {
      [Op.or]: [
        { category: { [Op.like]: '%' + searchQuery + '%' } },
        { imageName: { [Op.like]: '%' + searchQuery + '%' } }
      ]
    }

 if(isPersonalized){
  const colorResponse=await personalized_image.findAll({
    attributes: [
      [Sequelize.fn('DISTINCT', Sequelize.col('colorName')), 'colorName']
  ],
    distinct: true
  }) 

 const allColors= colorResponse.map((obj)=>{
  return obj?.dataValues?.colorName
  })
  const result = await personalized_image.findAndCountAll({
    offset: offset,
    limit: limit,
    where: finder,
    order: [['updatedAt', 'DESC']],

  });

  const pagination = {
    current_page: page,
    per_page: limit,
    count: result.count
  }

  result.pagination = pagination
  result.colors = allColors
  delete result.count;

  return result
 }
 else{
  const colorResponse=await image_template.findAll({
    attributes: [
      [Sequelize.fn('DISTINCT', Sequelize.col('colorName')), 'colorName']
  ],
    distinct: true
  }) 

 const allColors= colorResponse.map((obj)=>{
  return obj?.dataValues?.colorName
  })
  const result = await image_template.findAndCountAll({
    offset: offset,
    limit: limit,
    where:finder,
    order: [['updatedAt', 'DESC']],


  });

  const pagination = {
    current_page: page,
    per_page: limit,
    count: result.count
  }

  result.pagination = pagination
  result.colors = allColors
  delete result.count;

  return result
 }

}



const uploadLogo=async(req,res,session)=>{

  const imageName = req.body.imageName
  const logoBase64 = req.body.logoBase64


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
          "filename": imageName,
          "mimeType": "image/jpg",
          "httpMethod": "POST",
          "resource": "IMAGE"
        }

      ]
    }
  });

  const target = response.data?.stagedUploadsCreate?.stagedTargets[0]

  if (!target) {
    return false
  }

  const parameters = target.parameters
  const URL = target.url
  const form = new FormData();

  for (let obj of parameters) {
    form.append(obj.name, obj.value)
  }
  let bufferObj = Buffer.from(logoBase64, "base64");
  form.append("file", bufferObj)

  const uploadRespose = await axios.post(URL, form, {
    headers: {
      ...form.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    },
  });

  const $ = cheerio.load(uploadRespose.data);
  const url = $("location").text();

  if (!url) {
    return false
  }

  const file_Create_Mutation = `mutation fileCreate($files: [FileCreateInput!]!) {
    fileCreate(files: $files) {
      files {
        id
        alt
        updatedAt
        createdAt
        fileStatus
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
          "alt": imageName,
          "contentType": "IMAGE",
          "originalSource": url
        }
      ]
    }
  });

  console.log(fileResponse.data.fileCreate.files[0]);

  const fileStatus = fileResponse?.data?.fileCreate?.files[0]?.fileStatus;

  if (fileStatus === "UPLOADED") {

    const imageId = fileResponse.data.fileCreate.files[0].id
    const updatedAt = fileResponse.data.fileCreate.files[0].updatedAt
    const createdAt = fileResponse.data.fileCreate.files[0].createdAt
    const data = await getImageStatus(req, res, session, imageId);

    if (!data) {
      return false;

    }

    console.log("data -is", data);

  
      // const result = personalized_image.create({
      //   imageId: imageId,
      //   imageURL: data.node?.image?.url,
      //   updatedAt: updatedAt,
      //   createdAt: createdAt,
      //   category: "logo",
      //   imageName: imageName,
      //   colorName: null,
      // })

      return  data.node?.image?.url


  
  }
  else {
    return false
  }
}