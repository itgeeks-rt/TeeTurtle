import {
  Page,
  EmptySearchResult,
  ButtonGroup,
  Button,
  Thumbnail,
  IndexTable,
  Box,
  Text,
  Select,
  Card,
  TextField,
  Icon,
  useBreakpoints,
  Spinner,
  FormLayout,
  DropZone,
  BlockStack
} from "@shopify/polaris";
import '../assets/styles.css';
import { Modal, TitleBar, useAppBridge } from '@shopify/app-bridge-react';
import variable from '../Variable';
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { DeleteIcon } from '@shopify/polaris-icons';
import { NoteIcon } from '@shopify/polaris-icons';
import ImageCustomization from '../components/ImageCustomization'

export default function Template() {
  const { t } = useTranslation();
  const listLimit = 7;
  const shopify = useAppBridge();
  const baseUrl = variable.Base_Url;

  // State variables for managing images, pagination, form inputs, and loading states
  const [imageName, setImageName] = useState("");
  const [colorName, setColorName] = useState("");
  const [fetchImages, setFetchImages] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [pagination, setPagination] = useState([]);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState('Select');
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const [buttonRemoveLoading, setButtonRemoveLoading] = useState(false);
  const [loadingSpinner, setLoadingSpinner] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadedFileBase64, setUploadedFileBase64] = useState("");
  const [requestBody, setRequestBody] = useState({
    personalized: false,
    page: 1, 
    limit: listLimit,
  });
  const [customizeImageUrl, setCustomizeImageUrl] = useState({});
  
  const validImageTypes = ["image/jpeg", "image/png"];
  let myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  const category = [
    { label: 'Select', value: 'Select', disabled: true },
    { label: 'Classic Cotton', value: 'Classic Cotton' },
    { label: 'Premium Cotton', value: 'Premium Cotton' },
    { label: 'Long Sleeve', value: 'Long Sleeve' },
    { label: 'Crew Neck', value: 'Crew Neck' },
    { label: 'Hoodie', value: 'Hoodie' },
    { label: 'Triblend', value: 'Triblend' }, 
    { label: 'V-Neck', value: 'V-Neck' },
    { label: 'Tank Top', value: 'Tank Top' },
    { label: 'Mugs', value: 'Mugs' },
  ];


   /* Fetch template images from the server using AJAX */
  useEffect(() => {
    setLoadingSpinner(true);
    fetch(`${baseUrl}/external/image/imagesList?shop=itgeeks-test.myshopify.com`, {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: myHeaders,
      redirect: 'follow'
    })
      .then((res) => res.json())
      .then((data) => {
        const items = data?.result.rows || [];
        const itemPagination = data?.result.pagination || [];
        setPagination(itemPagination);
        setFetchImages(items); 
        setLoadingSpinner(false);
      })
      .catch((err) => {
        shopify.toast.show('Something went wrong. Please try again later.', { isError: true });
        console.error(err)
      });
  }, [requestBody]);


  /* Update pagination status based on the response */
  useEffect(() => {
    if (pagination && pagination.count > pagination.per_page) {
      const totalPages = Math.ceil(pagination.count / pagination.per_page);
      setHasNext(pagination.current_page < totalPages);
      setHasPrevious(pagination.current_page > 1);
      setCurrentPage(pagination.current_page);
    } else {
      setHasNext(false);
      setHasPrevious(false);
    }
  }, [pagination]);

  /* Handle search input change and fetch updated list of images */
  const handleSearchChange = (value) => {
    setSearchValue(value);
    const updatedRequestBody = {
      personalized: false,
      page: 1,
      limit: listLimit,
      ...(value && value.length >= 0 ? { searchQuery: value } : {}),
    };
    setRequestBody(updatedRequestBody);
  };

  /* Image upload form validation */
  const validateForm = (name, colorName, category, uploadFile) => {
    setIsButtonEnabled(name && colorName && category && category !== 'Select' && uploadFile);
  };

  /* Convert file to Base64 for upload */
  const convertToBase64 = (uploadFile) => {
    const reader = new FileReader(); 
    reader.onloadend = () => {
      setUploadedFileBase64(reader.result.split(',')[1]); // Save base64 encoded string
    };
    reader.readAsDataURL(uploadFile);
  };

  /* Handle file drop event */
  const handleDropZoneDrop = useCallback((_dropFiles, acceptedFiles, _rejectedFiles) => {
    const file = acceptedFiles[0];
    const maxSize = 5 * 1024 * 1024;
    if (file && validImageTypes.includes(file.type) && file.size <= maxSize) {
      setUploadFile(file);
      validateForm(imageName, colorName, selected, file);
      convertToBase64(file);
    } else {
      setUploadFile(null);
      setUploadedFileBase64("");
      validateForm(imageName, colorName, selected, null);
      shopify.toast.show('Maximum file size is 5MB', { isError: true });
    }
  }, [imageName, selected]);


  /* Handle image upload submission */
  const handleSubmit = () => {
    setIsButtonLoading(true);
    const requesUploadBody = {
      imageName: imageName,
      category: selected,  
      fileBase64: uploadedFileBase64,
      colorName: colorName,
      personalized: false
    };

    fetch(`${baseUrl}/external/image/uploadImage?shop=itgeeks-test.myshopify.com`, {
      method: "POST",
      body: JSON.stringify(requesUploadBody),
      headers: myHeaders,
      redirect: 'follow' 
    }) 
    .then((res) => res.json())
    .then((data) => {
      setIsButtonLoading(false);  
      if(data && data.status){  
        shopify.modal.hide('upload-image');
        shopify.toast.show('Image template created successfully.', { duration: 5000});
        setRequestBody({ page: 1, limit: listLimit, personalized: false });
        resetForm();
      }else if (data && data.message){
        shopify.toast.show(data.message, {isError: true,}); 
      }
    })
    .catch((err) => {
      setIsButtonEnabled(false);
      console.error(err)
      shopify.toast.show('Something went wrong. Please try again later.', { isError: true });
    });
  };


  /* Reset form state after successful upload */
  const resetForm = () => {
    setImageName("");
    setSelected("Select");
    setUploadFile(null);
    setUploadedFileBase64("");
    setIsButtonEnabled(false);
  };


  /* Handle image deletion */
  const removeTemplate = (imageId) => {
    setButtonRemoveLoading((prev) => ({ ...prev, [imageId]: true }));
    const requestDeleteBody = {
      imageId: imageId,
      personalized: false
    };
    fetch(`${baseUrl}/external/image/deleteImage?shop=itgeeks-test.myshopify.com`, {
      method: "DELETE",
      body: JSON.stringify(requestDeleteBody),
      headers: myHeaders,
      redirect: 'follow' 
    })
    .then((res) => res.json())
    .then((data) => { 
      setButtonRemoveLoading((prev) => ({ ...prev, [imageId]: false }));
      if(data && data.status){
        shopify.toast.show('Image template removed successfully.', {
          duration: 5000,
        });
        setRequestBody({ page: currentPage, limit: listLimit, personalized: false });
      }else if (data && data.message){
        shopify.toast.show(data.message, {isError: true});
      }
    })
    .catch((err) => {
      shopify.toast.show('Something went wrong. Please try again later.', { isError: true });
      console.error(err)
    });
  };

  const imageNameInput = (value) => {
    setImageName(value);
    validateForm(value, colorName, selected, uploadedFile);
  };
  const colorNameInput = (value) => {
    setColorName(value);
    validateForm(imageName, value, selected, uploadedFile);
  };
  const handleSelectChange = (value) => {
    setSelected(value);
    validateForm(imageName, colorName, value, uploadedFile);
  };

  const fileUpload = !uploadFile && <DropZone.FileUpload actionHint="Accepts only .jpg and .png" />;
  const uploadedFile = uploadFile && (
    <Box as="div" padding={{ xs: '400', sm: '400' }}>
      <BlockStack gap="150" inlineAlign="center" align="center">
        <Thumbnail
          size="small"
          alt={uploadFile.name}
          source={
            validImageTypes.includes(uploadFile.type)
              ? window.URL.createObjectURL(uploadFile)
              : NoteIcon
          }
        />
        <Text variant="bodySm" as="p">
          {uploadFile.name}{' '}
        </Text>
        <Button
          variant="plain" 
          tone="critical"
          onClick={() => {
            setUploadFile(null);
            validateForm(imageName, selected, null);
          }}
        >
          Change
        </Button>
      </BlockStack>
    </Box>
  );


  const handlerImageCustomizerPopup = (imageName, imageURL, category) => {
    shopify.modal.show('customize-image');
    setCustomizeImageUrl({imageName, imageURL, category});
  };

  const emptyStateMarkup = (
    <EmptySearchResult
      title={'No Results Found'}
      description={'Try changing the filters or search term'}
      withIllustration
    />
  );
 
  const resourceName = {
    singular: 'image',
    plural: 'images', 
  };

  const rowMarkup = fetchImages.map(
    (
      { id, imageURL, imageName, createdAt, category, imageId, colorName},
      index,
    ) => (
      <IndexTable.Row
        id={id}
        key={imageId}
        position={index}
      >
        <IndexTable.Cell>
          <Thumbnail
            source={imageURL}
            alt=""
          />
        </IndexTable.Cell>
        <IndexTable.Cell>{imageName}</IndexTable.Cell>
        <IndexTable.Cell>{category}</IndexTable.Cell>
        <IndexTable.Cell>{colorName}</IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="span" alignment="end">
            {createdAt}
          </Text>
        </IndexTable.Cell> 
        <IndexTable.Cell className="template-action__button">
          <ButtonGroup>
            <Button size="slim" onClick={() => handlerImageCustomizerPopup(imageName, imageURL, category)}>Use Template</Button>
            <Button size="slim" tone="critical" onClick={() => removeTemplate(imageId)} loading={buttonRemoveLoading[imageId]}>
                <Icon source={DeleteIcon} tone="critical" />
            </Button>   
          </ButtonGroup>
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  ); 

  return (
    <Page
      title="Templates"
      primaryAction={{ content: "Create new template", onAction: () => shopify.modal.show('upload-image') }}
      
    >
      <ImageCustomization imageObject={customizeImageUrl}/>
      <Modal id="upload-image">
        <Box padding={{ xs: '400', sm: '400' }}> 
          <FormLayout>
            <TextField
              label="Image Name (Maximum of 15 character)"
              maxLength="15"
              value={imageName}
              onChange={imageNameInput}
              placeholder="Image Name" 
              clearButton
              onClearButtonClick={() => imageNameInput("")}
            />
            <TextField
              label="Color Name"
              value={colorName}
              onChange={colorNameInput}
              placeholder="Color Name" 
              clearButton
              onClearButtonClick={() => colorNameInput("")}
            />
            <Select
              label="Select Category"
              options={category}
              onChange={handleSelectChange}
              value={selected}
            />
            <DropZone onDrop={handleDropZoneDrop} accept={validImageTypes} variableHeight>
              {uploadedFile}
              {fileUpload}
            </DropZone>
          </FormLayout>
        </Box>
        <Box padding={{ xs: '400', sm: '400' }} borderBlockStartWidth="0165" borderColor="border-brand">
          <BlockStack as="div" inlineAlign="end">
            <Button variant="primary" 
              disabled={!isButtonEnabled} 
              onClick={handleSubmit} 
              loading={isButtonLoading}>
              Upload
            </Button>
          </BlockStack> 
        </Box>
        <TitleBar title="Create template and upload a new image"></TitleBar>
      </Modal> 
      <Card padding={{ xs: '0', sm: '0' }}> 
        <Box padding={{ xs: '400', sm: '400' }}>
          <TextField
            value={searchValue}
            onChange={handleSearchChange}
            placeholder="Search By Category/Name"
            clearButton
            onClearButtonClick={() => handleSearchChange("")}
          />
        </Box>
        <Box position="relative">  
          <IndexTable
            condensed={useBreakpoints().smDown}
            resourceName={resourceName}
            itemCount={fetchImages.length}
            emptyState={emptyStateMarkup} 
            headings={[
              { title: "Image" },
              { title: "Name" },
              { title: "Category" },
              { title: "Color" },
              { title: "Create Date", alignment: "end" },
              { title: "Action", alignment: "end" },
            ]}
            selectable={false}
            pagination={{
              hasPrevious: hasPrevious,
              hasNext: hasNext,
              onNext: () => setRequestBody({ ...requestBody, page: currentPage + 1, personalized: false }),
              onPrevious: () => setRequestBody({ ...requestBody, page: currentPage - 1, personalized: false }),
            }}
          >
            {rowMarkup}
          </IndexTable>
          {loadingSpinner && (
            <Box as="span" className="box-center__center" position="absolute">
              <Spinner accessibilityLabel="Loading Spinner" size="large" />
            </Box>
          )}
        </Box>
      </Card>
    </Page>
  );
}
