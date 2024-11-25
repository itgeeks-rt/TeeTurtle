import shopify from "../../shopify.js"
import axios from "axios"
import FormData from "form-data"
import fs from "fs"
import * as cheerio from 'cheerio';
import db from "../models/index.js";
const product=db.productModel


export const uploadImage = async (req, res,session) => {

//   if(!req.file){
//     return {result:false,status:false}
//   }

//     const staged_Uploads_Create_Mutation = `
//   mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
//   stagedUploadsCreate(input: $input) {
//     stagedTargets {
//       url
//       resourceUrl
//       parameters {
//         name
//         value
//       }
//     }
//   }
// }
// `;



// const file_Create_Mutation=`mutation fileCreate($files: [FileCreateInput!]!) {
//   fileCreate(files: $files) {
//     files {
//       id
//       alt
//     }
//     userErrors {
//       field
//       message
//     }
//   }
// }
// `

// const client = new shopify.api.clients.Graphql({ session });

// const response = await client.request(staged_Uploads_Create_Mutation, {
//   variables: {
//     "input": [
//       {
//         "filename": "image.jpg",
//         "mimeType": "image/jpg",
//         "httpMethod": "POST",
//         "resource": "IMAGE"
//       }
     
//     ]
//   }
// });



// const parameters=response.data.stagedUploadsCreate.stagedTargets[0].parameters

const form = new FormData();

// for(let obj of parameters){

// form.append(obj.name,obj.value)
// }


// form.append('file', fs.createReadStream(req.file.path));


// console.log("form ----",form);

// const uploadRespose = await axios.post("https://shopify-staged-uploads.storage.googleapis.com/", form, {
//    headers: form.getHeaders(),
// });




//   const $ = cheerio.load(uploadRespose.data);
//   const url=$("location").text();
//   console.log(      "this is the extracted text--"     , $("location").text())
//   let fileResponse
// if(url){
//   fileResponse = await client.request(file_Create_Mutation, {
//     variables: {
//       "files": [
//         {
//           "alt": "Alt Image Text",
//           "contentType": "IMAGE",
//           "originalSource":url
//         }
//       ]
//     }
    
//   });
  
  
// }

// const imageId=fileResponse.data.fileCreate.files[0].id

//  return fileResponse.data

// const result=product.create({productId:"11111",imageId:"imageID1111"})
form.append("file",req.file.buffer)
console.log(form);
return "result"



};


export const getImage = async (req, res,session) => {

 

   
  const imageId=req.body.imageId
  
  const get_image_query=`query {
    node(id: "${imageId}") {
      id
      ... on MediaImage {
        image {
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
  
  


export const deleteImage = async (req, res,session) => {

 

   
const imageId=req.body.imageId

const file_delete_Mutation=`mutation fileDelete($input: [ID!]!) {
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






   


