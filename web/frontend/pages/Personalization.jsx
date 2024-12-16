import {
  Page,
  EmptySearchResult,
  ButtonGroup,
  Button,
  Thumbnail,
  IndexTable,
  Box,
  Text,
  Card,
  TextField,
  Icon,
  useBreakpoints,
  useIndexResourceState,
  Spinner,
  Popover,
  ChoiceList,
  InlineStack,
  Badge
} from "@shopify/polaris";
import '../assets/styles.css';
import { Modal, TitleBar, useAppBridge} from '@shopify/app-bridge-react';
import variable from '../Variable';
import { useState, useEffect, useCallback} from "react";
import { useTranslation } from "react-i18next";
import { DeleteIcon } from '@shopify/polaris-icons';
import FetchProduct from '../components/FetchProduct'
import { SearchIcon } from '@shopify/polaris-icons';



export default function Personalization() {
  const { t } = useTranslation();
  const listLimit = 7;
  const shopify = useAppBridge(); 
  const baseUrl = variable.Base_Url;

  // State variables for managing images, pagination, form inputs, and loading states
  const [fetchImages, setFetchImages] = useState([]);
  const [selectedImageUrl, setSelectedImageUrl] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [pagination, setPagination] = useState([]);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [buttonRemoveLoading, setButtonRemoveLoading] = useState(false);
  const [loadingSpinner, setLoadingSpinner] = useState(false);
  const [isModalButtonClick, setIsModalButtonClick] = useState(false);
  const [popoverCategoryActive, setCategoryPopoverActive] = useState(false);
  const [popoverColorActive, setColorPopoverActive] = useState(false);
  const [templateColors, setTemplateColors] = useState([]);
  const [selectedCategoryChoice, setSelectedCategoryChoice] = useState(['empty']);
  const [selectedColorChoice, setSelectedColorChoice] = useState(['empty']);
  const [selectedCategoryChoiceStr, setSelectedCategoryChoiceStr] = useState('empty');
  const [selectedColorChoiceStr, setSelectedColorChoiceStr] = useState('empty');
  const [removeImageId, setRemoveImageId] = useState([]);
  const [requestBody, setRequestBody] = useState({
    personalized: true,
    page: 1, 
    limit: listLimit,
  });
  
  let myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");


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
      personalized: true,
      page: 1,
      limit: listLimit,
      ...(value && value.length >= 0 ? { searchQuery: value } : {}),
    };
    setRequestBody(updatedRequestBody);
  };

  /* Sort by category */
  const toggleCategoryPopoverActive = useCallback(() => setCategoryPopoverActive((popoverCategoryActive) => !popoverCategoryActive),[],);
  const handleCategoryChange = useCallback((value) => {
    setSelectedCategoryChoice(value), [];
    setSelectedCategoryChoiceStr(value[0]);
    setRequestBody({ page: currentPage, color: selectedColorChoiceStr, category: value[0], limit: listLimit, personalized: true });
  });
  const categoryPopupButton = (
    <Button onClick={toggleCategoryPopoverActive} disclosure size="large">Sort by category</Button>
  );

   /* Sort by color */
   const toggleColorPopoverActive = useCallback(() => setColorPopoverActive((popoverColorActive) => !popoverColorActive),[],);
   const handleColorChange = useCallback((value) => {
    setSelectedColorChoice(value), [];
    setSelectedColorChoiceStr(value[0]);
    setRequestBody({ page: currentPage, color: value[0], category: selectedCategoryChoiceStr, limit: listLimit, personalized: true });
   });
   const colorPopupButton = (
     <Button onClick={toggleColorPopoverActive} disclosure size="large">Sort by color</Button>
   );

   const colorChoices = [
    { label: 'All color', value: 'empty' }, // Include 'All color' as a default option
    ...templateColors.map((color) => ({ label: color, value: color })),
  ];


  /* Handle image deletion */
  const removeTemplate = (imageId,id) => {
    setRemoveImageId([id]);
    setButtonRemoveLoading((prev) => ({ ...prev, [imageId]: true }));
    const requestDeleteBody = {
      imageId: imageId,
      personalized: true
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
        setRequestBody({ page: currentPage, limit: listLimit, personalized: true });
      }else if (data && data.message){
        shopify.toast.show(data.message, {isError: true});
      }
    })
    .catch((err) => {
      shopify.toast.show('Something went wrong. Please try again later.', { isError: true });
      console.error(err)
    });
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

  const {selectedResources, allResourcesSelected, handleSelectionChange, removeSelectedResources} = useIndexResourceState(fetchImages);

  const modalHandler = () => {
    setIsModalButtonClick(true)
    shopify.modal.show('select-product');
    const selectedImages = selectedResources.map((id) => {
      const selectedImage = fetchImages.find((image) => image.id === id);
      return selectedImage?.imageURL; // Return the URL or undefined if not found
    }).filter(Boolean);
    setSelectedImageUrl(selectedImages);
  }

  // Update the disabled state of the button whenever selectedResources changes
  useEffect(() => {
    setIsButtonDisabled(!(selectedResources && selectedResources.length > 0));
    if(removeImageId){
      removeSelectedResources(removeImageId)
      setRemoveImageId([]);
    }
  }, [selectedResources,removeImageId]);

  const rowMarkup = fetchImages.map(
    (
      { id, imageURL, logoUrl, imageName, createdAt, category, imageId, colorName },
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
        <IndexTable.Cell>
          <Thumbnail
            source={logoUrl}
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

  return (
    <Page
      title="Personalized Templates"
      primaryAction={{ content: "Select Product", onAction: () => modalHandler(), disabled: isButtonDisabled }}
    >
      
      <Modal id="select-product" onHide={() => setIsModalButtonClick(false)}>
        {isModalButtonClick ? (
          <FetchProduct selectedTemplates={selectedImageUrl}/>
        ): null}
        <TitleBar title="All products"></TitleBar> 
      </Modal>  
      <Card padding={{ xs: '0', sm: '0' }}> 
        <Box padding={{ xs: '400', sm: '400' }} className="searchbar-with__filters" borderBlockEndWidth="0165" borderColor="border-brand">
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
            onSelectionChange={handleSelectionChange}
            headings={[
              { title: "Image" },
              { title: "Logo" },
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
              onNext: () => setRequestBody({ ...requestBody, page: currentPage + 1, personalized: true }),
              onPrevious: () => setRequestBody({ ...requestBody, page: currentPage - 1, personalized: true }),
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
