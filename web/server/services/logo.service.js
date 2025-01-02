import shopify from "../../shopify.js"
import axios from "axios"
import FormData from "form-data"
import * as cheerio from 'cheerio';
import db from "../models/index.js";
import { Op } from "sequelize";
const logo_image = db.logo_image;
export const uploadLogo = async (req, res, session) => {

  const logoName = req.body.logoName
  const fileBase64 = req.body.logoBase64
  
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
          "filename": logoName,
          "mimeType": "image/png",
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
          "alt": logoName,
          "contentType": "IMAGE",
          "originalSource": url
        }
      ]
    }
  });



  const fileStatus = fileResponse?.data?.fileCreate?.files[0]?.fileStatus;

  if (fileStatus === "UPLOADED") {

    const imageId = fileResponse.data.fileCreate.files[0].id
    const updatedAt = fileResponse.data.fileCreate.files[0].updatedAt
    const createdAt = fileResponse.data.fileCreate.files[0].createdAt
    const data = await getImageStatus(req, res, session, imageId);

    if (!data) {
      return false;

    }

   
      const result = logo_image.create({
        logoId: imageId,
        logoURL: data.node?.image?.url,
        updatedAt: updatedAt,
        createdAt: createdAt,
        logoName: logoName,
        
      })

      return result
  
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

    const status = response.data?.node?.status;

    if (status === "FAILED") {
      return false
    }
    else if (status !== "READY" || status === "PROCESSING") {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return await getStatus();
    }
    return response.data;
  };
 
  await new Promise((resolve) => setTimeout(resolve, 1000));
 
  return await getStatus();
};

export const getLogoList = async (req, res, session) => {
   const searchQuery = req.body?.searchQuery || ""
    const page = parseInt(req.body.page) || 1
    const limit = parseInt(req.body.limit) || 10
    const offset = (page - 1) * limit
    const result = await logo_image.findAndCountAll({
      where: {
             logoName: { [Op.like]: '%' + searchQuery + '%' } 
          },
        offset: offset,
        limit: limit,
        order: [['updatedAt', 'DESC']], 
    });
    const pagination = {
        current_page: page,
        per_page: limit,
        count: result.count
      }
    
      result.pagination = pagination
      delete result.count;
  return result;
};
export const deleteLogo = async (req, res, session) => {
    console.log(
        req.body
    );
 
    const logoNameList = req.body.logoId
   
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
        "input": [logoNameList]
      }
    });
  
  
   
  
      const result = logo_image.destroy(
        {
        where: {
         logoId:logoNameList,
     },
    })
    return result
    
  
  
};
