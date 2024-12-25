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
  useIndexResourceState,
  BlockStack,
  Popover, 
  ChoiceList,
  Badge,
  InlineStack
} from "@shopify/polaris";
import '../assets/styles.css';
import { Modal, TitleBar, useAppBridge } from '@shopify/app-bridge-react';
import variable from '../Variable';
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { DeleteIcon } from '@shopify/polaris-icons';
import { NoteIcon } from '@shopify/polaris-icons';
import ImageCustomization from '../components/ImageCustomization'
import { SearchIcon } from '@shopify/polaris-icons';

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
  const [popoverCategoryActive, setCategoryPopoverActive] = useState(false);
  const [popoverColorActive, setColorPopoverActive] = useState(false);
  const [selectedCategoryChoice, setSelectedCategoryChoice] = useState(['empty']);
  const [selectedColorChoice, setSelectedColorChoice] = useState(['empty']);
  const [selectedCategoryChoiceStr, setSelectedCategoryChoiceStr] = useState('empty');
  const [selectedColorChoiceStr, setSelectedColorChoiceStr] = useState('empty');
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [selectedTableRow, setSelectedTableRow] = useState({});
  const [isModalButtonClick, setIsModalButtonClick] = useState(false);
  const [templateColors, setTemplateColors] = useState([]);
  const [fetchImageObject, setFetchImageObject] = useState([]);
  const [removeImageId, setRemoveImageId] = useState([]);
  const [requestBody, setRequestBody] = useState({
    color: "empty",
    category: "empty",
    personalized: false,
    page: 1, 
    limit: listLimit,
  });
    
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
        const colors = data?.result.colors || [];
        setTemplateColors(colors)
        setPagination(itemPagination);
        setFetchImages(items); 
        setLoadingSpinner(false);
        setFetchImageObject((prev) => {
          const merged = [...prev, ...items];
          const unique = merged.filter(
            (item, index, self) => 
              index === self.findIndex((i) => i.imageURL === item.imageURL) // Change 'id' to your unique property if necessary
          );
          return unique;
        });
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
      color: selectedColorChoiceStr,
      category: selectedCategoryChoiceStr,
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
        setRequestBody({ page: 1, color: selectedColorChoiceStr, category: selectedCategoryChoiceStr, limit: listLimit, personalized: false });
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
  const removeTemplate = (imageId, id) => {
    setRemoveImageId([id]);
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
        setRequestBody({ page: currentPage, color: selectedColorChoiceStr, category: selectedCategoryChoiceStr, limit: listLimit, personalized: false });
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
            validateForm(imageName, colorName, selected, null);
          }}
        >
          Change
        </Button>
      </BlockStack>
    </Box>
  );


  const {selectedResources, allResourcesSelected, handleSelectionChange, removeSelectedResources} = useIndexResourceState(fetchImages);

  // Update the disabled state of the button whenever selectedResources changes
  useEffect(() => {
    setIsButtonDisabled(!(selectedResources && selectedResources.length > 0));
    if(removeImageId.length){
      removeSelectedResources(removeImageId)
      setRemoveImageId([]);
    }
  }, [selectedResources,removeImageId]);

  const modalHandler = () => {
    const selectedRows = selectedResources.map((id) => {
      const selectedImage = fetchImageObject.find((image) => image.id === id);
      if (selectedImage) {
        return {
          imageURL: selectedImage.imageURL,
          name: selectedImage.imageName,
          category: selectedImage.category, 
          color: selectedImage.colorName,
        };
      }
      return null;
    }).filter(Boolean);
      setSelectedTableRow({
        rows: selectedRows,
      });
    setIsModalButtonClick(true);
    shopify.modal.show('customize-image');
  }


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
        selected={selectedResources.includes(id)}
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
            <Button size="slim" tone="critical" onClick={() => removeTemplate(imageId,id)} loading={buttonRemoveLoading[imageId]}>
                <Icon source={DeleteIcon} tone="critical" />
            </Button>   
          </ButtonGroup>
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  ); 
  
  /* Sort by category */
  const toggleCategoryPopoverActive = useCallback(() => setCategoryPopoverActive((popoverCategoryActive) => !popoverCategoryActive),[],);
  const handleCategoryChange = useCallback((value) => {
    setSelectedCategoryChoice(value), [];
    setSelectedCategoryChoiceStr(value[0]);
    setRequestBody({ page: currentPage, color: selectedColorChoiceStr, category: value[0], limit: listLimit, personalized: false });
  });
  const categoryPopupButton = (
    <Button onClick={toggleCategoryPopoverActive} disclosure size="large">Sort by category</Button>
  );

   /* Sort by color */
   const toggleColorPopoverActive = useCallback(() => setColorPopoverActive((popoverColorActive) => !popoverColorActive),[],);
   const handleColorChange = useCallback((value) => {
    setSelectedColorChoice(value), [];
    setSelectedColorChoiceStr(value[0]);
    setRequestBody({ page: currentPage, color: value[0], category: selectedCategoryChoiceStr, limit: listLimit, personalized: false });
   });
   const colorPopupButton = (
     <Button onClick={toggleColorPopoverActive} disclosure size="large">Sort by color</Button>
   );

   const colorChoices = [
    { label: 'All color', value: 'empty' }, // Include 'All color' as a default option
    ...templateColors.map((color) => ({ label: color, value: color })),
  ];
  

  return (
    <Page
      title="Templates"
      primaryAction={{ content: "Create new template", onAction: () => shopify.modal.show('upload-image') }}
      secondaryActions ={[{content: "Use template", onAction: () => modalHandler(), disabled: isButtonDisabled}]}
    >
      <Modal id="customize-image" variant="max" onHide={() => setIsModalButtonClick(false)}>
        {isModalButtonClick && (
          <ImageCustomization imageObjectData={selectedTableRow}/>
        )}
        <TitleBar title="Template Image Personalizer"></TitleBar>
      </Modal>
      
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
        <Box padding={{ xs: '400', sm: '400' }} className="searchbar-with__filters">
          <TextField
            prefix={<Icon source={SearchIcon}/>}
            value={searchValue}
            onChange={handleSearchChange}
            placeholder="Search"
            clearButton
            onClearButtonClick={() => handleSearchChange("")}
          />
          <Popover
            active={popoverCategoryActive}
            activator={categoryPopupButton}
            autofocusTarget="first-node" 
            onClose={toggleCategoryPopoverActive}
          >
            <Box padding={{ xs: '400', sm: '400' }}>
              <ChoiceList
                choices={[
                  {label: 'All category', value: 'empty'},
                  {label: 'Classic Cotton', value: 'Classic Cotton'},
                  {label: 'Premium Cotton', value: 'Premium Cotton'},
                  {label: 'Long Sleeve', value: 'Long Sleeve'},
                  {label: 'Crew Neck', value: 'Crew Neck'},
                  {label: 'Hoodie', value: 'Hoodie'},
                  {label: 'V-Neck', value: 'V-Neck'},
                  {label: 'Tank Top', value: 'Tank Top'},
                  {label: 'Mugs', value: 'Mugs'},
                ]}
                selected={selectedCategoryChoice}
                onChange={handleCategoryChange}
              />
            </Box>
          </Popover>
          <Popover
            active={popoverColorActive}
            activator={colorPopupButton}
            autofocusTarget="first-node" 
            onClose={toggleColorPopoverActive}
          >
            <Box padding={{ xs: '400', sm: '400' }}>
              <ChoiceList
                choices={colorChoices}
                selected={selectedColorChoice}
                onChange={handleColorChange}
              />
            </Box>
          </Popover>
          <InlineStack gap='200'>
            <Badge>Category: {selectedCategoryChoice == 'empty'? 'All category' : selectedCategoryChoice}</Badge>
            <Badge>Color: {selectedColorChoice == 'empty'? 'All color' : selectedColorChoice}</Badge>
          </InlineStack>
        </Box>
        <Box position="relative">  
          <IndexTable
            condensed={useBreakpoints().smDown}
            resourceName={resourceName}
            itemCount={fetchImages.length}
            emptyState={emptyStateMarkup} 
            selectedItemsCount={
              allResourcesSelected ? 'All' : selectedResources.length
            }
            //promotedBulkActions={[{content: 'Delete file', destructive: true, onAction: () => console.log('Todo: implement bulk edit')}]}
            onSelectionChange={handleSelectionChange}
            headings={[
              { title: "Image" },
              { title: "Name" },
              { title: "Category" },
              { title: "Color" },
              { title: "Create Date", alignment: "end" },
              { title: "Action", alignment: "end" },
            ]}
            selectable={true}
            pagination={{
              hasPrevious: hasPrevious,
              hasNext: hasNext,
              onNext: () => setRequestBody({ ...requestBody, page: currentPage + 1, personalized: false, color: selectedColorChoiceStr, category: selectedCategoryChoiceStr }),
              onPrevious: () => setRequestBody({ ...requestBody, page: currentPage - 1, personalized: false, color: selectedColorChoiceStr, category: selectedCategoryChoiceStr }),
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
