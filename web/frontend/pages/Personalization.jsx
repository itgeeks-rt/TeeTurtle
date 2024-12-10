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
  Spinner
} from "@shopify/polaris";
import '../assets/styles.css';
import { Modal, TitleBar, useAppBridge } from '@shopify/app-bridge-react';
import variable from '../Variable';
import { useState, useEffect} from "react";
import { useTranslation } from "react-i18next";
import { DeleteIcon } from '@shopify/polaris-icons';

export default function Personalization() {
  const { t } = useTranslation();
  const listLimit = 10;
  const shopify = useAppBridge(); 
  const baseUrl = variable.Base_Url;

  // State variables for managing images, pagination, form inputs, and loading states
  const [fetchImages, setFetchImages] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [pagination, setPagination] = useState([]);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [buttonRemoveLoading, setButtonRemoveLoading] = useState(false);
  const [loadingSpinner, setLoadingSpinner] = useState(false);
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


  /* Handle image deletion */
  const removeTemplate = (imageId) => {
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

  const {selectedResources, allResourcesSelected, handleSelectionChange} = useIndexResourceState(fetchImages);

  // Update the disabled state of the button whenever selectedResources changes
  useEffect(() => {
    setIsButtonDisabled(!(selectedResources && selectedResources.length > 0));
  }, [selectedResources]);

  const rowMarkup = fetchImages.map(
    (
      { id, imageURL, imageName, createdAt, category, imageId },
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
        <IndexTable.Cell>
          <Text as="span" alignment="end">
            {createdAt}
          </Text>
        </IndexTable.Cell> 
        <IndexTable.Cell className="template-action__button">
          <ButtonGroup>
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
      title="Personalized Templates"
      primaryAction={{ content: "Select Product", onAction: () => shopify.modal.show('select-product'), disabled: isButtonDisabled }}
    >
      <Modal id="select-product">
        <Box padding={{ xs: '0', sm: '0' }}> 
          <Box padding={{ xs: '400', sm: '400' }} borderBlockEndWidth="0165" borderColor="border-brand">
            <TextField
              value={searchValue}
              onChange={handleSearchChange}
              placeholder="Search products"
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
              selectedItemsCount={
                allResourcesSelected ? 'All' : selectedResources.length
              }
              onSelectionChange={handleSelectionChange}
              headings={[
                { title: "Image" },
                { title: "Name" },
                { title: "Category" },
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
              <Box as="span" className="table-loading__spinner" position="absolute">
                <Spinner accessibilityLabel="Loading Spinner" size="large" />
              </Box>
            )}
          </Box>
        </Box>
        <TitleBar title="All products">
          <button onClick={() => shopify.modal.hide('my-modal')}>Label</button>
        </TitleBar>
      </Modal> 
      <Card padding={{ xs: '0', sm: '0' }}> 
        <Box padding={{ xs: '400', sm: '400' }} borderBlockEndWidth="0165" borderColor="border-brand">
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
            selectedItemsCount={
              allResourcesSelected ? 'All' : selectedResources.length
            }
            onSelectionChange={handleSelectionChange}
            headings={[
              { title: "Image" },
              { title: "Name" },
              { title: "Category" },
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
            <Box as="span" className="table-loading__spinner" position="absolute">
              <Spinner accessibilityLabel="Loading Spinner" size="large" />
            </Box>
          )}
        </Box>
      </Card>
    </Page>
  );
}
