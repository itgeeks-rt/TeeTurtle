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
  Badge,
  Tooltip
} from "@shopify/polaris";
import '../assets/styles.css';
import { Modal, TitleBar, useAppBridge} from '@shopify/app-bridge-react';
import variable from '../Variable';
import { useState, useEffect, useCallback} from "react";
import { useTranslation } from "react-i18next";
import { DeleteIcon, SearchIcon, LinkIcon, CheckIcon } from '@shopify/polaris-icons';
import FetchProduct from '../components/FetchProduct'

export default function Personalization() {
  const { t } = useTranslation();
  const listLimit = 20;
  const shopify = useAppBridge(); 

  // State variables for managing images, pagination, form inputs, and loading states
  const [fetchImages, setFetchImages] = useState([]);
  const [selectedImageUrl, setSelectedImageUrl] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [pagination, setPagination] = useState([]);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
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
  const [copiedId, setCopiedId] = useState(null);
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
    fetch(`${variable.baseUrl}/external/image/imagesList?shop=${variable.shopUrl}`, {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: myHeaders,
      redirect: 'follow'
    })
      .then((res) => res.json())
      .then((data) => {
        clearSelection();
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
  const deleteSelectedFiles = () => {
    const imagesToRemove = fetchImages.filter((image) =>
      selectedResources.includes(image.id)
    );
    const imageIdsToRemove = imagesToRemove.map(image => image.imageId);
    if(imageIdsToRemove.length){
      setButtonRemoveLoading(true);
      const requestDeleteBody = {
        imageIds: imageIdsToRemove,
        personalized: true
      };
      fetch(`${variable.baseUrl}/external/image/deleteImage?shop=${variable.shopUrl}`, {
        method: "DELETE",
        body: JSON.stringify(requestDeleteBody),
        headers: myHeaders,
        redirect: 'follow' 
      })
      .then((res) => res.json())
      .then((data) => { 
        setButtonRemoveLoading(false);
        clearSelection();
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
    }
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

  const {selectedResources, allResourcesSelected, handleSelectionChange, removeSelectedResources, clearSelection} = useIndexResourceState(fetchImages);

  const handleCopyLink = (id, link) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setRemoveImageId([id]);
    setTimeout(() => setCopiedId(null), 2000);
  };


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
    if(removeImageId.length){
      removeSelectedResources(removeImageId)
      setRemoveImageId([]);
    }
  }, [removeImageId]);

  const promotedBulkActions = [
    {
      content: <Button variant="monochromePlain" onClick={() => modalHandler()}>Select Product</Button>,
      onAction: () => modalHandler()
    },
    {
      content: <Button variant="monochromePlain" loading={buttonRemoveLoading} icon={DeleteIcon}>Delete file</Button>,
      destructive: true, 
      onAction: () => deleteSelectedFiles()
    }
  ];

  const rowMarkup = fetchImages.map(
    (
      { id, imageURL, imageName, createdAt, category, imageId, colorName },
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
            <Tooltip content="Copy Link">
              <Button
                variant="tertiary"
                size="micro"
                onClick={() => handleCopyLink(id, imageURL)}
              >
                <Icon source={copiedId === id ? CheckIcon : LinkIcon} />
              </Button>
            </Tooltip>
          </ButtonGroup>
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  ); 

  return (
    <Page
      title="Personalized Templates"
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
            promotedBulkActions={promotedBulkActions}
            onSelectionChange={handleSelectionChange}
            headings={[
              { title: "Image", alignment: "start" },
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
